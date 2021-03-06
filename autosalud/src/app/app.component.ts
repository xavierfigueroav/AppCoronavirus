import { Component } from '@angular/core';
import { Platform, App, AlertController, LoadingController, ModalCmp } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StorageProvider } from '../providers/storage/storage';
import { AuthPage } from '../pages/auth/auth';
import { TabsPage } from '../pages/tabs/tabs';
import { FormPage } from '../pages/form/form';
import { UserPage } from '../pages/user/user';
import { ScoreProvider } from '../providers/score/score';
import { APIProvider } from '../providers/api/api';
import { FormsProvider } from '../providers/forms/forms';

@Component({
    templateUrl: 'app.html'
})

export class MyApp {

    activeNav: any;
    activePage: any;
    backButtonAlertPresent: boolean;

    constructor(
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private alertController: AlertController,
        private app: App,
        private loadingCtrl: LoadingController,
        private storage: StorageProvider,
        private scoreProvider: ScoreProvider,
        private api: APIProvider,
        private forms: FormsProvider
    ) {
        this.platform.ready().then(() => {
            const loader = this.loadingCtrl.create({
                content: "Espere...",
            });
            loader.present();

            this.platform.registerBackButtonAction(() => { this.handleBackButtonAction(); }, 1);

            this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.storage.getUser().then(user => {
                if (user !== null) {
                    this.storage.get('firstUseDate').then(firstUseDate => {
                        if(firstUseDate == null) {
                            this.app.getRootNav().setRoot(
                                FormPage,
                                { 'formType': 'initial' }
                            );
                        } else {
                            this.forms.checkForFormsUpdates();
                            this.scoreProvider.restartTrackingIfKilled();
                            this.api.sendPendingForms();
                            this.app.getRootNav().setRoot(TabsPage);
                        }
                    });
                } else {
                    this.app.getRootNav().setRoot(AuthPage);
                }
            });
            loader.dismiss();
        });
    }

    handleBackButtonAction() {
        if(this.backButtonAlertPresent) return;

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
                        this.backButtonAlertPresent = true;
                        this.confirmBackButtonAction();
                    }
                });
            } else if(this.activePage.component === ModalCmp) {
                this.activeNav.pop();
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
                    text: 'Sí',
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
                    text: 'No',
                    role: 'cancel'
                }
            ]
        });

        alert.present();
        alert.onDidDismiss(() => { this.backButtonAlertPresent = false; });
    }
}
