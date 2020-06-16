import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, AlertController, App, LoadingController, Navbar, Loading } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file';
import { TabsPage } from '../tabs/tabs';
import uuid from 'uuid/v4';
import * as Constants from '../../data/constants';

import * as calculos from '../../assets/calculos/calculo.json';
import * as plantilla from '../../assets/plantilla/plantilla.json';
import { AlertProvider } from '../../providers/alert/alert';

@Component({
    selector: 'page-form',
    templateUrl: 'form.html'
})
export class FormPage {
    calculos = (<any>calculos);
    infoTemplates = JSON.parse(JSON.stringify(<any>plantilla));
    template: any;
    formData: any;
    formsData = {};
    selectedTemplate: any;
    currentForm: any;
    forms: any[];
    pendingForms: any[];
    geoLocationAuth: string;
    coordinates = null;
    templateUuid: string;
    funciones = [];
    id_dataset: string;
    indice_seccion: number;
    locationLoader: Loading;
    loader: Loading;
    formulario_uso: any;
    isSavedForm: boolean;
    formChanged: boolean;

    @ViewChild(Navbar) navbarName: Navbar;

    constructor(
        private diagnostic: Diagnostic,
        private alertCtrl: AlertController,
        private navParams: NavParams,
        private storage: StorageProvider,
        private geoLocation: Geolocation,
        private locationAccuracy: LocationAccuracy,
        private loadingController: LoadingController,
        private navCtrl: NavController,
        private http: HTTP,
        private app: App,
        private file: File,
        private alerts: AlertProvider) {

        this.loader = this.loadingController.create({
            content: 'Espere...',
        });
        this.loader.present();

        this.storage.getDatasetId().then(id_dataset => {
            this.id_dataset = id_dataset;
        });

        this.isSavedForm = this.navParams.get('isSavedForm');
        this.formulario_uso = this.navParams.get('formulario_uso');
        this.formChanged = this.navParams.get('formChanged');

        if(this.formulario_uso) {
            this.prepareDataForForms();
        } else {
            const formType = this.navParams.get('formType');

            this.storage.get('savedForms').then(savedForms => {
                if(savedForms != null && savedForms[formType] != undefined) {
                    this.isSavedForm = true;
                    const pendingForm = savedForms[formType];
                    this.clickEditForm(pendingForm);
                } else {
                    if(formType === 'initial') {
                        this.storage.get('sentForms').then((sentForms) => {
                            if(sentForms != null && sentForms.length > 0) {
                                const initialForms = sentForms.filter(
                                    (sentForm: any) => sentForm.formData.type === 'initial'
                                );
                                if(initialForms.length > 0) {
                                    const pendingForm = initialForms[initialForms.length - 1];
                                    this.clickEditForm(pendingForm);
                                    return;
                                }
                            }
                            this.startForm(formType);
                        });
                    } else {
                        this.startForm(formType);
                    }
                }
            });
        }
    }

    async startForm(formType: string) {
        const template = this.infoTemplates[0];
        if (template.gps === 'required') {
            await this.requestLocationAuthorization(template, formType);
        } else {
            await this.startInitialForm(template, template.data[formType], formType);
        }
        this.prepareDataForForms();
    }

    prepareDataForForms() {
        try {
            for (let calc of this.calculos.calculos) {
                this.funciones[calc.name] = eval('var a;a=' + calc.structure);
            }
        } catch(error){
            console.log('[ERROR] prepateDataFormForms', error);
        } finally {
            this.cargarDatos();
        }
    }

    async clickEditForm(pendingForm: any) {
        try{
            const currentForm = pendingForm.formData;
            const templateUuid = pendingForm.template;

            let formsData = this.navParams.get('formsData') || await this.storage.get('formsData') || {};
            if(formsData[templateUuid] === undefined) {
                formsData[templateUuid] = [currentForm];
            }

            const forms = formsData[templateUuid];
            const currentFormExists = forms.filter((form: any) => form.uuid === currentForm.uuid).length > 0;
            if(!currentFormExists) {
                forms.push(currentForm);
            }

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

            // FIXME: Deep copies are made in when storing. Analyse whether this is still needed
            template.data = JSON.parse(JSON.stringify(currentForm.data));
            const selectedTemplate = JSON.parse(JSON.stringify(currentForm.data));

            let pendingForms = this.navParams.get('pendingForms') || await this.storage.get('pendingForms');

            if (pendingForms != null) {
                pendingForms.push(pendingForm);
            } else {
                pendingForms = [pendingForm];
            }

            this.formulario_uso = {
                template: template,
                selectedTemplate: selectedTemplate,
                formData: selectedTemplate,
                currentForm: currentForm,
                forms: forms,
                formsData: formsData,
                pendingForms: pendingForms,
                geolocationAuth: this.geoLocationAuth,
                infoTemplates: this.infoTemplates,
                infoTemplateIndex: infoTemplateIndex,
                indice_seccion: 0
            };

            this.prepareDataForForms();

        } catch(error) {
            console.log('[ERROR] clickEditForm', error);
        }
    }

    async startInitialForm(template: any, selectedTemplate: any, formType: string) {
        let formsData = this.navParams.get('formsData') || await this.storage.get('formsData');

        let forms: any[];
        if (formsData != null && Object.keys(formsData).length > 0 && formsData.hasOwnProperty(template.uuid)) {
            forms = formsData[template.uuid].slice(0);
        }

        const currentForm = {
            uuid: uuid(),
            version: 0,
            type: formType,
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

        let pendingForms = this.navParams.get('pendingForms') || await this.storage.get('pendingForms');

        const newPendingForm = {
            template: template.uuid,
            formData: currentForm,
            id_dataset: this.id_dataset,
            index: 0
        };

        if (pendingForms != null && pendingForms.length > 0) {
            if (formsData != null && formsData[template.uuid] != null) {
                newPendingForm.index = formsData[template.uuid].length;
            }
            pendingForms.push(newPendingForm);
        } else {
            pendingForms = [newPendingForm];
        }

        this.formulario_uso = {
            template: template,
            selectedTemplate: selectedTemplate,
            formData: selectedTemplate,
            currentForm: currentForm,
            forms: forms,
            formsData: formsData,
            pendingForms: pendingForms,
            geolocationAuth: this.geoLocationAuth,
            infoTemplates: this.infoTemplates,
            infoTemplateIndex: 0,
            indice_seccion: 0
        };
    }

    // FIXME: On permissions denied this do not return to the main tab and this one keeps empty.
    async requestLocationAuthorization(template: any, formType: string) {
        console.log('START OF REQUEST LOCATION', new Date().getTime());
        this.diagnostic.requestLocationAuthorization().then(res => {
            this.geoLocationAuth = res;
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
                        }).then(async (res) => {
                            this.locationLoader.dismiss();
                            this.coordinates = {
                                latitude: res.coords.latitude,
                                longitude: res.coords.longitude
                            }
                            await this.startInitialForm(template, template.data[formType], formType);
                        }).catch(async () => {
                            this.locationLoader.dismiss();
                            this.alerts.showLocationErrorAlert();
                            await  this.startInitialForm(template, template.data[formType], formType);
                        });
                    }).catch(() => {
                        this.loader.dismiss();
                        this.locationLoader.dismiss();
                        this.geoLocationAuth = 'DENIED';
                        this.alerts.showLocationNoPermissionAlert();
                        this.app.getRootNav().setRoot(TabsPage);
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
            this.startInitialForm(template, template.data[formType], formType);
            console.log(JSON.stringify(error));
        });
        console.log('END OF REQUEST LOCATION', new Date().getTime());
    }

    async cargarDatos() {
        this.template = this.formulario_uso.template;
        this.formData = this.formulario_uso.formData;
        this.selectedTemplate = this.formulario_uso.selectedTemplate;
        this.currentForm = this.formulario_uso.currentForm;
        this.currentForm.data = this.selectedTemplate;
        this.templateUuid = this.template.uuid;
        this.forms = this.formulario_uso.forms;
        this.geoLocationAuth = this.formulario_uso.geolocationAuth;
        this.pendingForms = this.formulario_uso.pendingForms;
        this.indice_seccion = this.formulario_uso.indice_seccion;

        if(this.formulario_uso.formsData != null) {
            this.formsData = this.formulario_uso.formsData;
        } else {
            let formsData = await this.storage.get('formsData');
            if (formsData != null) {
                this.formsData = formsData;
            }
        }
        this.loader.dismiss();
    }

    ngOnDestroy() {
        this.storage.get('formSent').then(async formSent => {
            if(formSent) {
                await this.storage.set('formSent', false);
            } else if (this.indice_seccion === 0) {
                // FIXME: do not save if it didn't change
                this.storage.get('savedForms').then(async savedForms => {
                    savedForms = savedForms || {};
                    savedForms[this.currentForm.type] = this.pendingForms[this.pendingForms.length - 1];
                    await this.storage.set('savedForms', savedForms);
                    await this.storage.set('formsData', this.formsData);
                });
            }
        });
    }

    siguienteSeccion(indice: number) {
        const array = Array.from(document.querySelectorAll('ion-datetime, ion-input, ion-list, ion-item'));
        const elementos = [];
        let errores = 0;

        for (var el of array) {
            if (el.id) {
                elementos.push(el.id);
            }
        }

        let params = this.mappingParametros(elementos);

        // FIXME: Get array 'elementos' from template
        params = params.filter(param => param !== undefined);
        for (let pa of params) {
            errores += this.validateBlurFunction('', pa.blurFunction);
        }

        if (errores == 0) {
            const nuevo_indice = Number(indice) + 1;
            if(this.formulario_uso.selectedTemplate.children.length > nuevo_indice) {
                this.formulario_uso.indice_seccion = nuevo_indice;
            } else {
                this.formulario_uso.indice_seccion = null;
            }
            this.navCtrl.push(FormPage, {
                'formulario_uso': this.formulario_uso,
                'formsData': this.formsData,
                'pendingForms': this.pendingForms,
                'formChanged': this.formChanged,
                'isSavedForm': this.isSavedForm
            });
        }
    }

    async finalizarEncuesta() {
        this.loader = this.loadingController.create({
            content: 'Espere...',
        });
        this.loader.present();

        const array = Array.from(document.querySelectorAll('ion-datetime, ion-input, ion-list, ion-item'));
        const elementos = [];
        let errores = 0;

        for (var el of array) {
            if (el.id) {
                elementos.push(el.id);
            }
        }

        let params = this.mappingParametros(elementos);
        // FIXME: Get array 'elementos' from template
        params = params.filter(param => param !== undefined);
        for (let pa of params) {
            errores += this.validateBlurFunction('', pa.blurFunction);
        }

        if (errores == 0) {
            await this.storage.set('formSent', true);
            this.enviarFormulario();
        } else {
            this.loader.dismiss();
        }
    }

    copyDeeply(object: any) {
        return JSON.parse(JSON.stringify(object));
    }

    save(index: number, pending_form_index: number) {
        this.formChanged = true;
        try {
            this.currentForm.saveDate = new Date();
            this.currentForm.data = this.selectedTemplate;
            this.forms[index] = this.currentForm;
            this.formsData[this.templateUuid] = this.forms;
            this.pendingForms[pending_form_index].formData = this.currentForm;
            this.pendingForms[pending_form_index].id_dataset = this.id_dataset;

            this.formulario_uso.selectedTemplate = this.pendingForms[pending_form_index].formData.data;
            this.formulario_uso.currentForm = this.currentForm;
            this.formulario_uso.forms = this.forms;
            this.formulario_uso.formsData = this.formsData;
            this.formulario_uso.formData = this.pendingForms[pending_form_index].formData.data;
            this.formulario_uso.pendingForms = this.pendingForms;
        } catch(error){
            console.log('[ERROR] save', error);
        }
    }

    async saveForm() {
        try {
            const formsDataIsNull = this.formsData == null;
            const formDataExists = (this.formsData != null &&
                this.formsData.hasOwnProperty(this.templateUuid));
            let currentFormExists = false;
            let pending_form_index = this.pendingForms.length - 1;
            if (formsDataIsNull || !formDataExists) {
                this.save(this.forms.length - 1, pending_form_index);
            }
            else {
                let index = 0;
                for (let form of this.formsData[this.templateUuid]) {
                    if (form.uuid == this.currentForm.uuid) {
                        currentFormExists = true;
                        break;
                    } else {
                        index += 1;
                    }
                }
                pending_form_index = 0;

                for (let pendingForm of this.pendingForms) {
                    if (pendingForm.formData.uuid == this.currentForm.uuid) {
                        break;
                    } else {
                        pending_form_index += 1;
                    }
                }

                if (!currentFormExists) {
                    this.save(this.forms.length - 1, pending_form_index);
                } else {
                    this.save(index, pending_form_index);
                }
            }
        } catch(error){
            console.log('[ERROR] saveForm', error);
        }
    }

    async enviarFormulario() {
        const pendingForms = this.copyDeeply(this.pendingForms);
        if(this.formChanged || this.isSavedForm) {
            const pendingForm = pendingForms[0];
            const id_dataset = pendingForm.id_dataset;
            this.subirArchivo(pendingForm, id_dataset);
        } else {
            this.app.getRootNav().setRoot(TabsPage);
            this.loader.dismiss();
            const alert = this.alertCtrl.create({
                subTitle: 'No se encontraron cambios a registrar.',
                buttons: ['cerrar']
            });
            alert.present();
        }
    }

    subirArchivo(pendingForm: any, id_dataset: string) {
        let fileName = 'AUTODIAGNÓSTICO';
        if(pendingForm.formData.type === 'initial') {
            fileName = 'DATOS-PERSONALES';
        }

        const formattedDate = this.obtenerFechaActual();
        fileName = fileName + '_' + formattedDate + '.json';
        const string_form = JSON.stringify(pendingForm, null, 2);

        this.file.createFile(this.file.externalApplicationStorageDirectory+'AppCoronavirus', fileName, true).then(() => {
            this.file.writeFile(this.file.externalApplicationStorageDirectory+'AppCoronavirus', fileName, string_form, {replace:true, append:false}).then((response) => {
                const carpeta = this.file.externalApplicationStorageDirectory+'AppCoronavirus/';
                const ruta_completa = carpeta + fileName;
                console.log('RUTA ARCHIVO:', ruta_completa);

                this.http.uploadFile(Constants.CREATE_RESOURCE_URL, {package_id: id_dataset, name: fileName}, {'Content-Type':'application/json','Authorization':'491c5713-dd3e-4dda-adda-e36a95d7af77'}, ruta_completa, 'upload').then((response) => {
                    this.file.removeFile(carpeta, fileName).then(async () => {
                        await this.storeDataAfterSend(pendingForm);
                        this.app.getRootNav().setRoot(TabsPage);
                        this.loader.dismiss();
                        this.alerts.showFormSentAlert();
                    }).catch(async () => {
                        await this.storeDataAfterSend(pendingForm);
                        this.app.getRootNav().setRoot(TabsPage);
                        this.loader.dismiss();
                        this.alerts.showFormSentAlert();
                    });
                }).catch(async error => {
                    console.log(error);
                    await this.setFirstUseDateIfAbsent();
                    this.app.getRootNav().setRoot(TabsPage);
                    this.loader.dismiss()
                    this.alerts.showConnectionErrorAlert();
                });
            }).catch(error => {
                console.log(error);
            });
        }).catch(error => {
            console.log(error);
        });
    }

    async storeDataAfterSend(pendingForm: any) {
        let sentForms = await this.storage.get('sentForms');
        if (sentForms != null && sentForms.length > 0) {
            sentForms.push(pendingForm);
        } else {
            sentForms = [pendingForm];
        }
        await this.storage.set('pendingForms', []);
        await this.storage.set('formsData', this.formsData);
        await this.storage.set('sentForms', sentForms);
        await this.clearSavedForms();
        await this.setFirstUseDateIfAbsent();
    }

    async clearSavedForms() {
        const savedForms = await this.storage.get('savedForms');
        if(this.isSavedForm) {
            savedForms[this.currentForm.type] = undefined;
            await this.storage.set('savedForms', savedForms);
        }
    }

    async setFirstUseDateIfAbsent() {
        const firstUseDate = await this.storage.get('firstUseDate');
        if(firstUseDate == null) {
            await this.storage.set('firstUseDate', new Date());
        }
    }

    obtenerFechaActual() {
        const fecha_actual = new Date();

        const dia = fecha_actual.getDate();
        let dia_actual = dia.toString();
        if(dia < 10) {
            dia_actual = '0' + dia.toString();
        }

        const mes = Number(fecha_actual.getMonth()) + 1;
        let mes_actual = mes.toString();
        if(mes < 10) {
            mes_actual = '0' + mes.toString();
        }

        const hora = fecha_actual.getHours();
        let hora_actual = hora.toString();
        if(hora < 10) {
            hora_actual = '0' + hora.toString();
        }

        const minutos = fecha_actual.getMinutes();
        let minutos_actual = minutos.toString();
        if(minutos < 10) {
            minutos_actual = '0' + minutos.toString();
        }

        const segundos = fecha_actual.getSeconds();
        let segundos_actual = segundos.toString();
        if(segundos < 10) {
            segundos_actual = '0' + segundos.toString();
        }

        const fecha = dia_actual + '-' + mes_actual + '-' + fecha_actual.getFullYear() + '_' + hora_actual + '-'+ minutos_actual + '-' + segundos_actual;
        return fecha;
    }

    saveCoordinates() {
        try {
            this.currentForm.coordinates = this.coordinates;
            const index = this.forms.length - 1;
            this.forms[index] = this.currentForm;
            this.formsData[this.templateUuid] = this.forms;
            this.pendingForms[this.pendingForms.length - 1].formData = this.currentForm;
        } catch(error){
            console.log('[BUG] saveCoordinates', error);
        }
    }

    mappingParametros(parameters: any[]) {
        try {
            const parametrosMapeados = [];
            for (let i = 0; i < parameters.length; i++) {
                parametrosMapeados.push(this.getObjects(this.selectedTemplate, 'id', parameters[i])[0]);
            }
            return parametrosMapeados;
        } catch(error){
            console.log('[ERROR] mappingParametros', error);
        }
    }

    construirFuncionDinamicaString(stringFuncion: string, stringParametros: string, lengthParametros: number) {
        try {
            let funcionString = stringFuncion + '(';
            for (let i = 0; i < lengthParametros; i++) {
                if (i == lengthParametros - 1) {
                    funcionString = `${funcionString}${stringParametros}[${i}])`;
                }
                else {
                    funcionString = `${funcionString}${stringParametros}[${i}],`;
                }
            }
            return funcionString;
        } catch(error){
            console.log('[ERROR] construirFuncionDinamicaString', error);
        }
    }

    triggerFunction(functionName: string) {
        try {
            const funcion = this.funciones[functionName];
            const args = this.getArgs(funcion);
            const parametrosMapeados = this.mappingParametros(args);
            const stringFuncionMapeada = this.construirFuncionDinamicaString('funcion', 'parametrosMapeados', parametrosMapeados.length);
            eval(stringFuncionMapeada);
        }
        catch (error) {
            console.log('[ERROR] triggerFunction', error);
            const alert = this.alertCtrl.create({
                title: 'Error',
                subTitle: 'La funcion de calculo tiene un error interno',
                buttons: ['ok']
            });
            alert.present();
        }
    }

    getObjects(obj, key, val) {
        try {
            let objects = [];
            for (let i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if (typeof obj[i] == 'object') {
                    objects = objects.concat(this.getObjects(obj[i], key, val));
                } else
                    //if key matches and value matches or if key matches and
                    //value is not passed (eliminating the case where key
                    // matches but passed value does not)
                    if (i == key && obj[i] == val || i == key && val == '') { //
                        objects.push(obj);
                    } else if (obj[i] == val && key == '') {
                        //only add if the object is not already in the array
                        if (objects.lastIndexOf(obj) == -1) {
                            objects.push(obj);
                        }
                    }
            }
            return objects;
        } catch(error){
            console.log('[ERROR] getObjects', error);
        }
    }

    triggerFunctionValidation(nombre_funcion, args) {
        try {
            // DO NOT DELETE THE NEXT LINE, ALTHOUGH IT SEEMS NOT TO BE USED
            const funcion = this.funciones[nombre_funcion];
            const parametrosMapeados = this.mappingParametros(args);
            const stringFuncionMapeada = this.construirFuncionDinamicaString('funcion', 'parametrosMapeados', parametrosMapeados.length);
            const valor = eval(stringFuncionMapeada);
            return valor;
        }
        catch (error) {
            const alert = this.alertCtrl.create({
                title: 'Error',
                subTitle: 'La funcion de calculo tiene un error interno',
                buttons: ['ok']
            });
            alert.present();
            console.log('[ERROR] triggerFunctionValidation', error);
        }
    }

    getArgs(func) {
        // First match everything inside the function argument parens.
        const args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];
        // Split the arguments string into an array comma delimited.
        return args.split(',').map(function(arg) {
            // Ensure no inline comments are parsed and trim the whitespace.
            return arg.replace(/\/\*.*\*\//, '').trim();
        }).filter(function(arg) {
            // Ensure no undefined values are added.
            return arg;
        });
    }

    clickCollapseButton(index, id, $event) {
        try {
            const buttonElement = $event.currentTarget;
            const collapse = document.getElementById(id);
            if (collapse.getAttribute('class') == 'collapse') {
                buttonElement.getElementsByTagName('ion-icon')[0].setAttribute('class', 'icon icon-md ion-md-arrow-dropdown item-icon');
            } else if (collapse.getAttribute('class') == 'collapse show') {
                buttonElement.getElementsByTagName('ion-icon')[0].setAttribute('class', 'icon icon-md ion-md-arrow-dropright item-icon');
            }
        } catch(error) {
            console.log('[ERROR] clickCollapseButton', error);
        }
    }

    clickNextPage(item2,indexCategoria,indexSubCategoria) {
        try {
            const param = this.navParams.data;
            param.selectedTemplate = item2;
            this.navCtrl.push(FormPage, param);
        } catch(error){
            console.log('[ERROR] clickNextPage', error);
        }
    }

    keyupFunction($event, functionName) {
        if (functionName) {
            this.triggerFunction(functionName);
        }
        this.saveForm();
    }

    validateBlurFunction($event, functionName) {
        var valores = 0;
        if (functionName != '') {
            let funcion = JSON.parse(functionName);
            for (let key in funcion) {
                let value = funcion[key];
                valores += this.triggerFunctionValidation(key, value); //KEY: NOMBRE DE LA FUNCIÓN, VALUE: LISTA DE ARGUMENTOS
            }
        }
        return valores;
    }

    blurFunction($event, functionName) {
        var valores = this.validateBlurFunction($event,functionName);
        this.saveForm();
        return valores;
    }

    clickFunction($event, functionName) {
        if (functionName) {
            this.triggerFunction(functionName);
        }
        this.saveForm();
    }

    onEnterKey(e) {
        if (e.keyCode == 13) {
            let activeElement = <HTMLElement>document.activeElement;
            activeElement && activeElement.blur && activeElement.blur();
        }
      }
}
