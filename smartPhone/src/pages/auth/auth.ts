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

@Component({
    selector: 'page-auth',
    templateUrl: 'auth.html'
})

export class AuthPage {
    //url = "https://insavit.espol.edu.ec/api/validate_user/";
    //urlFunctions = "http://150.136.213.20/dataset/0cfc0e05-8e4c-435a-893b-5d12ede68f0f/resource/d0173624-db8d-4487-929e-e69872e5c840/download/calculos.json";
    linkedUser = null;
    cedula;
    infoTemplates = [];
    string_cedula;
    id_dataset;

    constructor(private intelSecurity: IntelSecurity,
        public httpClient: HttpClient, public appCtrl: App,
        public menuCtrl: MenuController, private secureStorage: SecureStorage,
        private storage: Storage, public navCtrl: NavController,
        public navParams: NavParams, public http: HTTP,
        public network: Network, public loadingCtrl: LoadingController,
        public alertCtrl: AlertController) {
        // Or to get a key/value pair

        this.menuCtrl.enable(false);

        this.storage.get('linkedUser').then((val) => {
            if(val) {
                this.linkedUser = val;
            }
        }, err => {
            console.log('Hubo un error al obtener los cálculos');
            console.log(err);
        });

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

    attemptAuth() {
        
        if (this.linkedUser) {
            const loader = this.loadingCtrl.create({
                content: "Espere ...",
            });
            loader.present();
            this.intelSecurity.storage.read({ id: 'cedula' })
                .then((instanceID: number) => this.intelSecurity.data.getData(instanceID))
                .then((data: string) => {
                    if (this.cedula == data) {
                        loader.dismiss();
                        this.linkedUser.sesion = true;
                        this.getInfoPlantilla().then((result) => {
                            this.storage.set('linkedUser', this.linkedUser).then(data => {
                                this.appCtrl.getRootNav().setRoot(TabsPage);
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
            if(isNaN(Number(this.cedula)) || !Number.isInteger(Number(this.cedula)) || Number(this.cedula) < 0 || this.cedula.length != 10) {
                loader.dismiss();
                const alert = this.alertCtrl.create({
                    subTitle: 'Por favor, ingrese un número de cédula válido',
                    buttons: ['OK']
                });
                alert.present();
                return 0;
            } else {
                loader.dismiss();
            }

            this.httpClient.get('./assets/plantilla/plantilla.json').subscribe(res => {
                this.storage.set('templates', res);
                //if (JSON.parse(res.data).uid != undefined) {
                    this.intelSecurity.data.createFromData({ data: this.cedula })
                        .then((instanceID: Number) => {
                            this.intelSecurity.storage.write({
                                id: "cedula",
                                instanceID: instanceID
                            });
                            //this.storage.set('templates', JSON.parse(res.data).templates)
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
        //this.encriptarCedula();

        var string_cedula = '{"name":"'+this.cedula+'","owner_org":"0daa04ac-4b43-4316-bbf0-537cd5b881ac"}';
        var objeto = JSON.parse(string_cedula);
        var url = "http://ec2-3-17-143-36.us-east-2.compute.amazonaws.com:5000/api/3/action/package_create";
        console.log("SE CREARÁ EL DATASET");
            
        this.http.post(url, objeto, {'Content-Type':'application/json','Authorization':'491c5713-dd3e-4dda-adda-e36a95d7af77'})
            .then(res => {
                console.log("EXITO AL CREAR DATASET");
                var respuesta = JSON.parse(res.data);
                this.storage.set('id_dataset', respuesta.result.id).then((data) => {
                    console.log("SE GUARDÓ EL ID DATASET");
                    this.storage.set('linkedUser', {
                        cedula: this.cedula,
                        sesion: true
                    }).then((data) => {
                        //loader.dismiss();
                        this.getInfoPlantilla().then((result) => {
                            this.appCtrl.getRootNav().setRoot(TabsPage);
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

    encriptarCedula() {
        this.cedula;
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