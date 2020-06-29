import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, App, LoadingController, Loading } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file';
import { TabsPage } from '../tabs/tabs';
import * as Constants from '../../data/constants';

import { AlertProvider } from '../../providers/alert/alert';

@Component({
    selector: 'page-form',
    templateUrl: 'form.html'
})
export class FormPage {
    formData: any;
    editingForm: any;
    validationFunctions: any[];
    dataset: string;
    sectionIndex: number;
    loader: Loading;
    isSavedForm: boolean;
    formChanged: boolean;

    constructor(
        private alertCtrl: AlertController,
        private navParams: NavParams,
        private storage: StorageProvider,
        private loadingController: LoadingController,
        private navCtrl: NavController,
        private http: HTTP,
        private app: App,
        private file: File,
        private alerts: AlertProvider
    ) {

        this.loader = this.loadingController.create({ content: 'Espere...' });
        this.loader.present();

        this.storage.getDatasetId().then(datasetId => { this.dataset = datasetId; });

        this.setValidationFunctions();

        this.formData = this.navParams.get('formData');
        this.isSavedForm = this.navParams.get('isSavedForm');
        this.formChanged = this.navParams.get('formChanged');
        this.sectionIndex = this.navParams.get('sectionIndex') || 0;

        this.dispatchTemplate();
    }

    async setValidationFunctions() {
        const validations = await this.storage.get('formValidators');
        this.validationFunctions = [];
        for (let calc of validations.calculos) {
            this.validationFunctions[calc.name] = eval('var a;a=' + calc.structure);
        }
    }

    dispatchTemplate() {
        if(this.formData) {
            this.editingForm = this.formData.form;
            this.loader.dismiss();
        } else {
            const formType = this.navParams.get('formType');
            this.storage.get('lastForms').then(lastForms => {
                if(lastForms == null || lastForms[formType] == null) {
                    this.startForm(formType);
                } else {
                    const form = lastForms[formType];
                    this.isSavedForm = this.isSavedForm || form.saved;
                    this.editForm(form);
                }
            }).catch(console.log);
        }
    }

    async startForm(formType: string) {
        let template = await this.storage.get('formTemplates');
        template = template[formType][0];
        this.editingForm = template.data[formType];
        this.formData = {
            template: template.uuid,
            dataset: this.dataset,
            created: new Date(),
            type: formType,
            form: this.editingForm
        };
        this.editingForm = this.formData.form;
        this.loader.dismiss();
    }

    async editForm(template: any) {
        this.editingForm = template.form;
        this.formData = {
            template: template.template,
            dataset: this.dataset,
            created: template.saved ? template.created : new Date(),
            type: template.type,
            form: this.editingForm
        };
        this.editingForm = this.formData.form;
        this.loader.dismiss();
    }

    ngOnDestroy() {
        this.storage.get('formSent').then(async formSent => {
            if(formSent) {
                await this.storage.set('formSent', false);
            } else if (this.sectionIndex === 0) {
                const lastForms = await this.storage.get('lastForms') || {};
                this.formData.saved = true;
                lastForms[this.formData.type] = this.formData;
                await this.storage.set('lastForms', lastForms);
            }
        });
    }

    async saveChanges() {
        this.formData.form = this.editingForm;
        this.formChanged = true;
    }

    nextSection() {
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
            this.navCtrl.push(FormPage, {
                'formData': this.formData,
                'formChanged': this.formChanged,
                'isSavedForm': this.isSavedForm,
                'sectionIndex': this.sectionIndex + 1
            });
        }
    }

    async finishForm() {
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

    async enviarFormulario() {
        if(this.formChanged || this.isSavedForm) {
            delete this.formData.saved;
            this.subirArchivo(this.formData);
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

    subirArchivo(form: any) {
        let fileName = 'AUTODIAGNÓSTICO';
        if(form.type === 'initial') {
            fileName = 'DATOS-PERSONALES';
        }

        const formattedDate = this.obtenerFechaActual();
        fileName = fileName + '_' + formattedDate + '.json';
        form.finished = new Date();
        const string_form = JSON.stringify(form, null, 2);

        this.file.createFile(this.file.externalApplicationStorageDirectory+'AppCoronavirus', fileName, true).then(() => {
            this.file.writeFile(this.file.externalApplicationStorageDirectory+'AppCoronavirus', fileName, string_form, {replace:true, append:false}).then(() => {
                const carpeta = this.file.externalApplicationStorageDirectory+'AppCoronavirus/';
                const ruta_completa = carpeta + fileName;
                console.log('RUTA ARCHIVO:', ruta_completa);

                this.http.uploadFile(Constants.CREATE_RESOURCE_URL, {package_id: form.dataset, name: fileName}, {'Content-Type':'application/json','Authorization':'491c5713-dd3e-4dda-adda-e36a95d7af77'}, ruta_completa, 'upload').then((response) => {
                    this.file.removeFile(carpeta, fileName).then(async () => {
                        await this.storeDataAfterSend(form);
                        this.app.getRootNav().setRoot(TabsPage);
                        this.loader.dismiss();
                        this.alerts.showFormSentAlert();
                    }).catch(async () => {
                        await this.storeDataAfterSend(form);
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

    async storeDataAfterSend(form: any) {
        const lastForms = await this.storage.get('lastForms') || {};
        if(form.type === 'follow_up') {
            const template = await this.storage.get('formTemplates');
            form.form = template[form.type][0].data.follow_up;
        }
        lastForms[form.type] = form;
        await this.storage.set('lastForms', lastForms);
        await this.setFirstUseDateIfAbsent();
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

    mappingParametros(parameters: any[]) {
        try {
            const parametrosMapeados = [];
            for (let i = 0; i < parameters.length; i++) {
                parametrosMapeados.push(this.getObjects(this.editingForm, 'id', parameters[i])[0]);
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
            const funcion = this.validationFunctions[functionName];
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
            const funcion = this.validationFunctions[nombre_funcion];
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
        this.saveChanges();
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
        this.saveChanges();
        return valores;
    }

    clickFunction($event, functionName) {
        if (functionName) {
            this.triggerFunction(functionName);
        }
        this.saveChanges();
    }

    onEnterKey(e) {
        if (e.keyCode == 13) {
            let activeElement = <HTMLElement>document.activeElement;
            activeElement && activeElement.blur && activeElement.blur();
        }
    }
}
