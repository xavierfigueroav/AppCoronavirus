import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, ViewController, Events, MenuController, App } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { HomePage } from '../home/home';
import { TabsPage } from '../tabs/tabs';
import { Storage } from '@ionic/storage';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage';
import { Md5 } from 'ts-md5/dist/md5';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IntelSecurity } from '@ionic-native/intel-security';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { FormPage } from '../form/form';
import { File } from '@ionic-native/file';
import uuid from 'uuid/v4';

@Component({
    selector: 'page-auth',
    templateUrl: 'auth.html'
})

export class AuthPage {
    //url = "https://insavit.espol.edu.ec/api/validate_user/";
    //urlFunctions = "http://150.136.213.20/dataset/0cfc0e05-8e4c-435a-893b-5d12ede68f0f/resource/d0173624-db8d-4487-929e-e69872e5c840/download/calculos.json";
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

    constructor(private intelSecurity: IntelSecurity,
        public httpClient: HttpClient, public appCtrl: App,
        public menuCtrl: MenuController, private secureStorage: SecureStorage,
        private storage: Storage, public navCtrl: NavController,
        public navParams: NavParams, public http: HTTP, private file: File,
        public network: Network, public loadingCtrl: LoadingController, private geolocation: Geolocation,
        public alertCtrl: AlertController, private diagnostic: Diagnostic, private locationAccuracy: LocationAccuracy) {

        this.menuCtrl.enable(false);
        this.file = file;
        this.storage.get('linkedUser').then((val) => {
            if(val) {
                this.linkedUser = val;
            }
        }, err => {
            console.log('Hubo un error al obtener los cálculos');
            console.log(err);
        });

        this.crearDirectorio();

        /*this.httpClient.get(this.urlFunctions).subscribe(res => {
            this.storage.set('calculos', res);
        }, err => {
            console.log('error no puede conectarse al servidor para descarga de calculos');
            console.log(err);
            this.httpClient.get('./assets/calculos/calculos.json').subscribe(res => {
                this.storage.set('calculos', res);
            }, err => {
                console.log('Hubo un error al obtener los cálculos');
                console.log(err);
            });
        });*/

        /*this.httpClient.get('./assets/calculos/calculos.json').subscribe(res => {
            this.storage.set('calculos', res);
        }, err => {
            console.log('Hubo un error al obtener los cálculos');
            console.log(err);
        });*/
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

    attemptAuth() {
        if (this.linkedUser) {
            const loader = this.loadingCtrl.create({
                content: "Espere ...",
            });
            loader.present();
            this.intelSecurity.storage.read({ id: 'codigo_app' })
                .then((instanceID: number) => this.intelSecurity.data.getData(instanceID))
                .then((data: string) => {
                    if (this.codigo_app == data) {
                        loader.dismiss();
                        this.linkedUser.sesion = true;
                        this.getInfoPlantilla().then((result) => {
                            this.storage.set('linkedUser', this.linkedUser).then(data => {
                                this.appCtrl.getRootNav().setRoot(TabsPage);
                                //var infotemplate = this.storage.get("")
                            });
                        });
                    } else {
                        loader.dismiss();
                        const alert = this.alertCtrl.create({
                            title: 'Credenciales incorrectas!',
                            subTitle: 'Inténtelo de nuevo',
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                }) // Resolves to 'Sample Data'
                .catch((error: any) => console.log(error));
        } else {
            /*this.http.post(this.url, { username: this.user.username, password: this.user.password }, {})
                .then(res => {
                    const alert = this.alertCtrl.create({
                        subTitle: JSON.parse(res.data).msg,
                        buttons: ['OK']
                    });
                    alert.present();
                    if (JSON.parse(res.data).uid != undefined) {
                        this.intelSecurity.data.createFromData({ data: this.user.password })
                            .then((instanceID: Number) => {
                                this.intelSecurity.storage.write({
                                    id: "usuarioClave",
                                    instanceID: instanceID
                                });
                                this.storage.set('templates', JSON.parse(res.data).templates)
                                this.storage.set('linkedUser', {
                                    username: this.user.username,
                                    sesion: true,
                                    uid: JSON.parse(res.data).uid
                                }).then((data) => {
                                    loader.dismiss();
                                    this.getInfoPlantilla().then((result) => {
                                        this.appCtrl.getRootNav().setRoot(HomePage);
                                    });
                                }).catch(error => {
                                    loader.dismiss();
                                    console.log('error de guardado storage', error);
                                });

                            })
                            .catch((error: any) => {
                                console.log(error);
                            });
                    } else {
                        loader.dismiss();
                    }
                })
                .catch(error => {

                    console.log("error", error);

                    loader.dismiss();
                    if (error.status == 403) {
                        const alert = this.alertCtrl.create({
                            subTitle: 'Hubo un problema de conexión. Intentelo más tarde',
                            buttons: ['OK']
                        });
                        alert.present();
                    } else if (error.status == 500) {
                        const alert = this.alertCtrl.create({
                            subTitle: 'Lo sentimos, hubo un problema en el servidor. Intentelo más tarde',
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                    else {
                        const alert = this.alertCtrl.create({
                            subTitle: 'Usuario o contraseña incorrectos',
                            buttons: ['OK']
                        });
                        alert.present();
                    }
                });*/
            const loader = this.loadingCtrl.create({
                content: "Espere ...",
            });
            loader.present();
            /*if(isNaN(Number(this.codigo_app)) || !Number.isInteger(Number(this.codigo_app)) || Number(this.codigo_app) < 0 || this.codigo_app.length != 10) {
                loader.dismiss();
                const alert = this.alertCtrl.create({
                    subTitle: 'Por favor, ingrese un número de cédula válido',
                    buttons: ['OK']
                });
                alert.present();
                return 0;
            } else {
                loader.dismiss();
            }*/

            this.httpClient.get('./assets/plantilla/plantilla.json').subscribe(res => {
                this.storage.set('templates', res);
                //if (JSON.parse(res.data).uid != undefined) {
                    this.intelSecurity.data.createFromData({ data: this.codigo_app })
                        .then((instanceID: Number) => {
                            this.intelSecurity.storage.write({
                                id: "codigo_app",
                                instanceID: instanceID
                            });
                            //this.storage.set('templates', JSON.parse(res.data).templates)
                            loader.dismiss();
                            this.crearDataset();
                        })
                        .catch((error: any) => {
                            console.log(error);
                        });
                /*} else {
                    loader.dismiss();
                }*/
            }, err => {
                console.log('error no puede conectarse al servidor para descarga de plantilla');
                console.log(err);
            });

            this.httpClient.get('./assets/calculos/calculo.json').subscribe(res => {
                this.storage.set('calculos', res);
            }, err => {
                console.log('error no puede conectarse al servidor para descarga de plantilla');
                console.log(err);
            }); //DESCOMENTAR
        }
    }

    crearDataset() {
        var string_codigo = '{"name":"'+this.codigo_app+'","owner_org":"0daa04ac-4b43-4316-bbf0-537cd5b881ac"}';
        var objeto = JSON.parse(string_codigo);
        var url = "http://ec2-3-17-143-36.us-east-2.compute.amazonaws.com:5000/api/3/action/package_create";
        console.log("SE CREARÁ EL DATASET");
            
        this.http.post(url, objeto, {'Content-Type':'application/json','Authorization':'491c5713-dd3e-4dda-adda-e36a95d7af77'})
            .then(res => {
                console.log("EXITO AL CREAR DATASET");
                var respuesta = JSON.parse(res.data);
                this.storage.set('id_dataset', respuesta.result.id).then((data) => {
                    console.log("SE GUARDÓ EL ID DATASET");
                    this.storage.set('linkedUser', {
                        codigo_app: this.codigo_app,
                        sesion: true
                    }).then((data) => {
                        //loader.dismiss();
                        this.getInfoPlantilla().then((result) => {
                            //this.appCtrl.getRootNav().setRoot(TabsPage);
                            this.storage.get("infoTemplates").then((info_templates) => {
                                var info_template = info_templates[0];
                                this.startForm(info_template, 'initial', 0);
                            });
                        });
                    }).catch(error => {
                        //loader.dismiss();
                        console.log('error de guardado storage', error);
                    });
                }).catch(error => {
                    console.log('ERROR AL GUARDAR EL ID DATASET', error);
                });
            })
            .catch(error => {
                console.log("ERROR AL CREAR DATASET");
                console.log(error);
                if(error.status == 0) {
                    const alert = this.alertCtrl.create({
                        title: "Error",
                        subTitle: 'Por favor asegúrese que cuenta con una conexión a internet.',
                        buttons: ['OK']
                    });
                    alert.present();
                    return 0;
                }
            });
    }

    async getInfoPlantilla() {
        await this.storage.get('templates').then((templates) => {
            for (let template of templates) {
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
        });
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
                            this.httpClient.get('./assets/plantilla/plantilla.json').subscribe(res => {
                                this.storage.set('templates', res);
                            }, err => {
                                console.log('error no puede conectarse al servidor para descarga de plantilla');
                                console.log(err);
                            });
                            /*this.httpClient.get(this.urlFunctions).subscribe(res => {
                                this.storage.set('calculos', res);
                            }, err => {
                                console.log('error no puede conectarse al servidor para descarga de calculos');
                                console.log(err);
                                this.httpClient.get('./assets/calculos/calculo.json').subscribe(res => {
                                    this.storage.set('calculos', res);
                                }, err => {
                                    console.log('Hubo un error al obtener los cálculos');
                                    console.log(err);
                                }
                                );
                            });*/
                            /*this.httpClient.get('./assets/calculos/calculo.json').subscribe(res => {
                                this.storage.set('calculos', res);
                            }, err => {
                                console.log('Hubo un error al obtener los cálculos');
                                console.log(err);
                            });*/ //DESCOMENTAR
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

}  