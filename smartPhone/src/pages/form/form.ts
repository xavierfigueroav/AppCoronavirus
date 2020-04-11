import { Component, ViewChild, Injector } from '@angular/core';
import { NavController, MenuController, ViewController, NavParams, Events, AlertController, Platform, App, LoadingController, Navbar, PopoverController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Coordinates, Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HTTP } from '@ionic-native/http';
import { HttpClient } from '@angular/common/http';
import { File } from '@ionic-native/file';
import { HomePage } from '../home/home';
import { TabsPage } from '../tabs/tabs';
import { PopoverPage } from './popover';
import { PopoverPage2 } from './popover2';

@Component({
    selector: 'page-form',
    templateUrl: 'form.html'
})
export class FormPage extends PopoverPage {
    template;
    formData;
    formsData = {};
    selectedTemplate;
    currentForm;
    forms;
    pendingForms;
    geolocationAuth;
    coordinates;
    templateUuid;
    funciones = [];
    infoTemplates = [];
    loading;
    infoTemplateIndex;
    id_dataset;
    indice_seccion;

    @ViewChild(Navbar) navbarName: Navbar;

    constructor(
        private diagnostic: Diagnostic,
        public alertCtrl: AlertController,
        public navParams: NavParams,
        private events: Events,
        public menuCtrl: MenuController,
        private storage: Storage,
        private geolocation: Geolocation,
        private locationAccuracy: LocationAccuracy,
        public loadingController: LoadingController,
        public navCtrl: NavController,
        public platform: Platform,
        public http: HTTP,
        public httpClient: HttpClient,
        public popoverCtrl: PopoverController,
        public viewCtrl: ViewController,
        public appCtrl: App,
        private file: File,
        public loadingCtrl: LoadingController,) {
        super(viewCtrl);

        try {
            this.menuCtrl.enable(true);

            this.file = file

            this.storage.get('id_dataset').then((id_dataset) => {
                this.id_dataset = id_dataset;
            }).catch(error => {
                console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)));
            });

            this.storage.get('calculos').then((calculos) => {
                for (let calc of calculos.calculos) {
                    this.funciones[calc.name] = eval('var a;a=' + calc.structure);
                }
            }).catch(error => {
                console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)));
            });
        } catch(e){
            console.log("constructor");
        }

    }

    siguienteSeccion(indice) {
        console.log("SE DIO CLIC EN BOTÓN HACIA ADELANTE "+indice);
        var array = Array.from(document.querySelectorAll("ion-datetime, ion-input, ion-list, ion-item"));
        var elementos = [];
        var errores = 0;
        
        for (var el of array) {
            if (el.id) {
                elementos.push(el.id);
            }
        }

        var params = this.mappingParametros(elementos);
        
        for (var pa of params) {
            errores += this.validateBlurFunction("", pa.blurFunction);
        }
        if (errores == 0) {
            this.storage.get("formulario_uso").then((form_temp) => {
                console.log("FORM TEMP 1: ", form_temp);
                var nuevo_indice = Number(indice) + 1;
                console.log("NUEVO INDICE: ", nuevo_indice);
                console.log("LONGITUD SELECTED TEMPLATE: ", form_temp.selectedTemplate.children.length);
                if(form_temp.selectedTemplate.children.length>nuevo_indice) {
                    form_temp.indice_seccion = nuevo_indice;
                } else {
                    form_temp.indice_seccion = null;
                }        
                console.log("FORM TEMP 2: ", form_temp);
                this.storage.set("formulario_uso", form_temp).then(() => {
                    this.appCtrl.getRootNav().setRoot(FormPage);
                });
            });   
        }
    }

    anteriorSeccion(indice) {
        console.log("SE DIO CLIC EN BOTÓN HACIA ATRÁS "+indice);
        var array = Array.from(document.querySelectorAll("ion-datetime, ion-input, ion-list, ion-item"));
        var elementos = [];
        var errores = 0;
        
        for (var el of array) {
            if (el.id) {
                elementos.push(el.id);
            }
        }

        var params = this.mappingParametros(elementos);
        
        for (var pa of params) {
            errores += this.validateBlurFunction("", pa.blurFunction);
        }
        if (errores == 0) {
            this.storage.get("formulario_uso").then((form_temp) => {
                console.log("FORM TEMP 1: ", form_temp);
                var nuevo_indice = Number(indice) - 1;
                console.log("NUEVO INDICE: ", nuevo_indice);
                console.log("LONGITUD SELECTED TEMPLATE: ", form_temp.selectedTemplate.children.length);
                if(nuevo_indice>=0) {
                    form_temp.indice_seccion = nuevo_indice;
                } else {
                    form_temp.indice_seccion = null;
                }        
                console.log("FORM TEMP 2: ", form_temp);
                this.storage.set("formulario_uso", form_temp).then(() => {
                    this.appCtrl.getRootNav().setRoot(FormPage);
                });
            });   
        }
    }

    finalizarEncuesta() {
        console.log("SE DIO CLIC EN FINALIZAR ENCUESTA");
        var array = Array.from(document.querySelectorAll("ion-datetime, ion-input, ion-list, ion-item"));
        var elementos = [];
        var errores = 0;
        
        for (var el of array) {
            if (el.id) {
                elementos.push(el.id);
            }
        }

        var params = this.mappingParametros(elementos);
        
        for (var pa of params) {
            errores += this.validateBlurFunction("", pa.blurFunction);
        }
        console.log("ERRORES: ", errores);
        console.log("ELEMENTOS: ", elementos);
        if (errores == 0) {
            //this.navCtrl.pop();
            this.enviarFormulario();
            //ENVIAR ENCUESTA Y MANDAR A TABS
        }
    }

    async cargarDatos() {
        console.log("EMPIEZA LA CARGA DE DATOS");
        var formulario_uso = await this.storage.get('formulario_uso');
        console.log("FORMULARIO USO:", formulario_uso);
        this.template = formulario_uso.template;
        this.formData = formulario_uso.formData;
        this.selectedTemplate = formulario_uso.selectedTemplate;
        console.log("SELECTED TEMPLATE: ", this.selectedTemplate);
        this.currentForm = formulario_uso.currentForm;
        this.templateUuid = this.template.uuid;
        this.infoTemplateIndex = formulario_uso.infoTemplateIndex;
        this.forms = formulario_uso.forms;
        this.geolocationAuth = formulario_uso.geolocationAuth;
        this.pendingForms = formulario_uso.pendingForms;
        this.infoTemplates = formulario_uso.infoTemplates;
        this.indice_seccion = formulario_uso.indice_seccion;
        console.log("INDICE ACTUAL: ", this.indice_seccion);
        if(formulario_uso.formsData != null) {
            this.formsData = formulario_uso.formsData;
        } else {
            var formsData = await this.storage.get("formsData");
            if (formsData != null) {
                this.formsData = formsData;
            }
        }        
    }

    ionViewDidEnter() {
        this.cargarDatos();
        /*try {
            this.navbarName.backButtonClick = () => {
                var array = Array.from(document.querySelectorAll("ion-datetime, ion-input, ion-list, ion-item"));
                var elementos = [];
                var errores = 0;
                
                for (var el of array) {
                    if (el.id) {
                        elementos.push(el.id);
                    }
                }

                var params = this.mappingParametros(elementos);
                
                for (var pa of params) {
                    errores += this.validateBlurFunction("", pa.blurFunction);
                }
                if (errores == 0) {
                    this.navCtrl.pop();
                }
            }
        } catch(e){
            console.log("ionViewDidEnter");
        }*/
    }

    save(index, pending_form_index) {
        try {    
            this.currentForm.saveDate = new Date();
            this.currentForm.data = this.formData;
            this.forms[index] = this.currentForm;
            this.formsData[this.templateUuid] = this.forms;
            this.storage.set("formsData", this.formsData);
            this.pendingForms[pending_form_index].formData = this.currentForm;
            this.pendingForms[pending_form_index].id_dataset = this.id_dataset;
            this.storage.set("pendingForms", this.pendingForms);
            this.storage.get("formulario_uso").then((form_temp) => {
                form_temp.selectedTemplate = this.pendingForms[pending_form_index].formData.data;
                form_temp.currentForm = this.currentForm;
                form_temp.forms = this.forms;
                form_temp.formsData = this.formsData;
                form_temp.formData = this.pendingForms[pending_form_index].formData.data;
                form_temp.pendingForms = this.pendingForms;
                this.storage.set("formulario_uso", form_temp);
            });
        } catch(e){
            console.log("save");
        }
    }

    async saveForm() {
        try {   
            let formsDataIsNull = this.formsData == null;
            let formDataExists = (this.formsData != null &&
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
                    //CREATE
                    this.storage.set("pendingForms", this.pendingForms);
                    this.save(this.forms.length - 1, pending_form_index);
                } else {
                    //EDIT
                    this.save(index, pending_form_index);
                }
            }
        } catch(e){
            console.log("saveForm");
        }
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
            } else {
                let alert = this.alertCtrl.create({
                    subTitle: "No hay nuevos datos. No se ha enviado ningún formulario",
                    buttons: ["cerrar"]
                });
                alert.present();
                this.appCtrl.getRootNav().setRoot(TabsPage);
            }
        });
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
        
        const loader = this.loadingCtrl.create({
            content: "Espere ...",
        });
        loader.present();

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
                            let alert = this.alertCtrl.create({
                                subTitle: "Se ha enviado correctamente el formulario",
                                buttons: ["cerrar"]
                            });
                            loader.dismiss();
                            alert.present();
                            this.appCtrl.getRootNav().setRoot(TabsPage);
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
                            let alert = this.alertCtrl.create({
                                subTitle: "Se ha enviado correctamente el formulario",
                                buttons: ["cerrar"]
                            });
                            loader.dismiss();
                            alert.present();
                            this.appCtrl.getRootNav().setRoot(TabsPage);
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

    saveCoordinates() {
        try {
            this.currentForm.coordinates = this.coordinates;
            let index = this.forms.length - 1;
            this.forms[index] = this.currentForm;
            this.formsData[this.templateUuid] = this.forms;
            this.storage.set("formsData", this.formsData);
            this.pendingForms[this.pendingForms.length - 1].formData = this.currentForm;
            this.storage.set("pendingForms", this.pendingForms);
        } catch(e){
            console.log("saveCoordinates");
        }
    }

    mappingParametros(parameters) {
        try {
            let parametrosMapeados = [];
            for (let i = 0; i < parameters.length; i++) {
                parametrosMapeados.push(this.getObjects(this.formData, 'id', parameters[i])[0]);
            }
            return parametrosMapeados;
        } catch(e){
            console.log("mappingParametros");
        }
    }

    construirFuncionDinamicaString(stringFuncion, stringParametros, lengthParametros) {
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
        } catch(e){
            console.log("construirFuncionDinamicaString");
        }
    }

    triggerFunction(functionName) {
        try {
            let funcion = this.funciones[functionName];
            let args = this.getArgs(funcion);
            let parametrosMapeados = this.mappingParametros(args);
            let stringFuncionMapeada = this.construirFuncionDinamicaString('funcion', 'parametrosMapeados', parametrosMapeados.length);
            eval(stringFuncionMapeada);
        }
        catch (err) {
            console.log("triggerFunction");
            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            let alert = this.alertCtrl.create({
                title: "Error",
                subTitle: "La funcion de calculo tiene un error interno",
                buttons: ["ok"]
            });
            alert.present();
        }
    }

    getObjects(obj, key, val) {
        try {    
            var objects = [];
            for (var i in obj) {
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
        } catch(e){
            console.log("getObjects");
        }
    }

    triggerFunctionValidation(nombre_funcion, args) {
        try {
            let funcion = this.funciones[nombre_funcion];
            let parametrosMapeados = this.mappingParametros(args);
            let stringFuncionMapeada = this.construirFuncionDinamicaString('funcion', 'parametrosMapeados', parametrosMapeados.length);
            var valor = eval(stringFuncionMapeada);
            return valor;
        }
        catch (err) {
            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            let alert = this.alertCtrl.create({
                title: "Error",
                subTitle: "La funcion de calculo tiene un error interno",
                buttons: ["ok"]
            });
            alert.present();
            console.log("triggerFunctionValidation");
            console.log(err.message);
        }
    }

    getArgs(func) {
        // First match everything inside the function argument parens.
        var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];
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
            let buttonElement = $event.currentTarget;
            let collapse = document.getElementById(id);
            if (collapse.getAttribute('class') == "collapse") {
                buttonElement.getElementsByTagName('ion-icon')[0].setAttribute('class', 'icon icon-md ion-md-arrow-dropdown item-icon');
            } else if (collapse.getAttribute('class') == "collapse show") {
                buttonElement.getElementsByTagName('ion-icon')[0].setAttribute('class', 'icon icon-md ion-md-arrow-dropright item-icon');
            }
        } catch(e){
            console.log("clickCollapseButton");
        }
    }

    clickNextPage(item2,indexCategoria,indexSubCategoria) {
        try {    
            let param = this.navParams.data;
            param.selectedTemplate = item2;
            this.navCtrl.push(FormPage, param);
        } catch(e){
            console.log("clickNextPage");
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

    requestLocationAuthorization() {
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
                                this.geolocationAuth = "GRANTED";
                                this.loading.dismiss();
                                this.coordinates = {
                                    latitude: res.coords.latitude,
                                    longitude: res.coords.longitude
                                };
                                this.saveCoordinates();

                            }).catch((error) => {
                                this.loading.dismiss();
                                console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)));
                                let alert = this.alertCtrl.create({
                                    title: "Error",
                                    subTitle: "No pudimos acceder a tu ubicación.",
                                    buttons: ["ok"]
                                });
                                alert.present();
                            });
                        }).catch(err => {
                            this.geolocationAuth = "DENIED";
                            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
                        }).catch(err => {
                            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
                        });
                }
            }).catch(err => {
                console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            });
        });

    }
}