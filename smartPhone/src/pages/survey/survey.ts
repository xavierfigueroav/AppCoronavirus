import { Component } from '@angular/core';
import { LoadingController, App, Loading } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { FormPage } from '../form/form';
import uuid from 'uuid/v4';

import * as plantilla from '../../assets/plantilla/plantilla.json';
import { AlertProvider } from '../../providers/alert/alert';
import { TabsPage } from '../tabs/tabs';

@Component({
	selector: 'page-survey',
	templateUrl: 'survey.html',
})

export class SurveyPage {
    infoTemplates = JSON.parse(JSON.stringify(<any>plantilla));
    pendingForms = [];
    formsData = {};
    geolocationAuth;
    coordinates = null;
    locationLoader: Loading;
    loader: Loading;

	constructor(
        private diagnostic: Diagnostic,
        private locationAccuracy: LocationAccuracy,
        private geoLocation: Geolocation,
        private storage: Storage,
        private alerts: AlertProvider,
        private loadingController: LoadingController,
        private appCtrl: App) {

        this.loader = this.loadingController.create({
            content: 'Espere...',
        });
        this.loader.present();

        this.storage.get('pendingForms').then((pendingForms) => {
            this.pendingForms = pendingForms;
        });

        this.storage.get('formsData').then((formsData) => {
            if (formsData !== null && Object.keys(formsData).length > 0) {
                this.formsData = formsData;
            }
        });

        this.storage.get('sentForms').then((sentForms) => {
            if(sentForms != null && sentForms.length > 0) {
                const initialForms = sentForms.filter((sentForm: any) => sentForm.formData.type === 'initial');
                if(initialForms.length > 0) {
                    const pendingForm = initialForms[initialForms.length - 1];
                    this.clickEditForm(sentForms, pendingForm);
                } else {
                    this.startForm();
                }
            } else {
                this.startForm();
            }
        });
    }

    startForm() {
        const info_template = this.infoTemplates[0];
        if (info_template.gps === 'required') {
            this.requestLocationAuthorization(info_template);
        } else {
            this.startInitialForm(info_template, info_template.data.initial);
        }
    }

    async clickEditForm(sentForms: any[], pendingForm: any) {
        try{
            let currentForm = pendingForm.formData;
            let templateUuid = pendingForm.template;
            let formsData = await this.storage.get('formsData');
            let forms = formsData[templateUuid];

            let template: any;
            let infoTemplateIndex: number;
            for (let i = 0; i < this.infoTemplates.length; i++) {
                let temp = this.infoTemplates[i];
                if (temp.uuid === templateUuid) {
                    template = temp;
                    infoTemplateIndex = i;
                    break;
                }
            }

            // Although this may look dumb, it is the easiest way to make a deep copy
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
                infoTemplates: this.infoTemplates,
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

    startInitialForm(template: any, selectedTemplate: any) {
        this.storage.get('formsData').then((formsData) => {
            this.formsData = formsData;
            let currentForm = {};
            let forms: any[];

            if (this.formsData != null && Object.keys(this.formsData).length > 0 && this.formsData.hasOwnProperty(template.uuid)) {
                forms = this.formsData[template.uuid].slice(0);
            }

            currentForm = {
                uuid: uuid(),
                version: 0,
                type: 'initial',
                name: template.name,
                gps: template.gps,
                data: {},
                createdDate: new Date()
            };
            if (template.gps === 'required') {
                currentForm['coordinates'] = this.coordinates;
            }

            if (forms != null && forms.length > 0) {
                forms.push(currentForm);
            } else {
                forms = [currentForm];
            }

            this.storage.get('pendingForms').then((pendingForms) => {
                this.pendingForms = pendingForms;
                const newPendingForm = {
                    template: template.uuid,
                    score_movilidad: 0,
                    score_salud_personal: 0,
                    formData: currentForm,
                    index: 0
                };

                if (this.pendingForms != null && this.pendingForms.length > 0) {
                    pendingForms = this.pendingForms.slice(0);
                    if (this.formsData != null && this.formsData[template.uuid] != null) {
                        newPendingForm.index = this.formsData[template.uuid].length;
                    }
                    pendingForms.push(newPendingForm);
                } else {
                    pendingForms = [newPendingForm];
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
                    infoTemplateIndex: 0,
                    indice_seccion: 0
                };

                this.storage.set('formulario_uso', formulario_uso);
                this.loader.dismiss();
                this.appCtrl.getRootNav().setRoot(FormPage);
            });
        });
    }

    // FIXME: On permissions denied this do not return to the main tab and this one keeps empty.
    requestLocationAuthorization(template: any) {
        this.diagnostic.requestLocationAuthorization().then(res => {
            this.geolocationAuth = res;
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
                if (canRequest) {
                    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(() => {
                        this.locationLoader = this.loadingController.create({
                            content: 'Obteniendo ubicación...',
                        });
                        this.locationLoader.present();
                        this.geoLocation.getCurrentPosition({
                            enableHighAccuracy: true,
                            timeout: 12000
                        }).then((res) => {
                            this.locationLoader.dismiss();
                            this.coordinates = {
                                latitude: res.coords.latitude,
                                longitude: res.coords.longitude
                            }
                            this.startInitialForm(template, template.data.initial);
                        }).catch(() => {
                            this.locationLoader.dismiss();
                            this.alerts.showLocationErrorAlert();
                            this.startInitialForm(template, template.data.initial);
                        });
                    }).catch(() => {
                        this.loader.dismiss();
                        this.locationLoader.dismiss();
                        this.geolocationAuth = 'DENIED';
                        this.alerts.showLocationNoPermissionAlert();
                        this.appCtrl.getRootNav().setRoot(TabsPage);
                        return 0;
                    });
                } else {
                    this.loader.dismiss();
                    this.alerts.showLocationNoPermissionAlert();
                    return 0;
                }
            }).catch(error => {
                this.loader.dismiss();
                this.alerts.showLocationNoPermissionAlert();
                console.log(JSON.stringify(error));
                return 0;
            });

        }).catch(error => {
            this.loader.dismiss();
            this.startInitialForm(template, template.data.initial);
            console.log(JSON.stringify(error));
        });
    }

}
