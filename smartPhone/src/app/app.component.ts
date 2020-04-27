import { Component } from '@angular/core';
import { Platform, App, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../pages/auth/auth';
import { TabsPage } from '../pages/tabs/tabs';
import { ScoreProvider } from '../providers/score/score';
import { FormPage } from '../pages/form/form';
import { UserPage } from '../pages/user/user';

@Component({
    templateUrl: 'app.html'
})

export class MyApp {

    activeNav: any;
    activePage: any;

    constructor(
        private storage: Storage,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private scoreService: ScoreProvider,
        private alertController: AlertController,
        private app: App) {
        this.platform.ready().then(() => {

            this.platform.registerBackButtonAction(() => { this.handleBackButtonAction(); }, 1);

            this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.scoreService.startBackgroundGeolocation();

            this.storage.get('linkedUser').then((linkedUser) => {
                if (linkedUser !== null) {
                    this.storage.get('firstUseDate').then(firstUseDate => {
                        if(firstUseDate == null) {
                            console.log('NO FIRST USE DATE');
                            this.app.getRootNav().setRoot(
                                FormPage,
                                { 'formType': 'initial' }
                            );
                        } else {
                            this.app.getRootNav().setRoot(TabsPage);
                        }
                    });
                } else {
                    this.app.getRootNav().setRoot(AuthPage);
                }
            });
        });
    }

    handleBackButtonAction() {
        this.activeNav = this.app.getActiveNav();

        if(this.activeNav.canGoBack()) {
            this.activeNav.pop();
        } else {
            this.activePage = this.activeNav.getActive();
            if(this.activePage.component === UserPage || this.activePage.component === AuthPage) {
                this.platform.exitApp();
            } else if(this.activePage.component === FormPage){
                this.storage.get('firstUseDate').then(firstUseDate => {
                    if(firstUseDate == null) {
                        this.platform.exitApp();
                    } else {
                        this.confirmBackButtonAction();
                    }
                });
            } else {
                this.app.getRootNav().setRoot(TabsPage, { 'tabIndex': 0 });
            }
        }
    }

    confirmBackButtonAction() {
        const alert = this.alertController.create({
            title: 'Formulario incompleto',
            subTitle: '¿Deseas continuar?',
            message: 'Si continúas, el formulario no se enviará, pero se guardará para que lo edites más tarde.',
            buttons: [
                {
                    text: 'Salir',
                    handler: () => {
                        const tabIndex = this.activePage.data.formType === 'initial' ? 0 : 1;
                        this.app.getRootNav().setRoot(
                            TabsPage,
                            { 'tabIndex': tabIndex },
                            { animate: true, direction: 'back' }
                        );
                    }
                },
                {
                    text: 'Cancelar',
                    role: 'cancel'
                }
            ]
        });
        alert.present();
    }
}
