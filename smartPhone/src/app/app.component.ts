import { Component } from '@angular/core';
import { Platform, App } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../pages/auth/auth';
import { TabsPage } from '../pages/tabs/tabs';
import { ScoreProvider } from '../providers/score/score';

@Component({
    templateUrl: 'app.html'
})

export class MyApp {

    constructor(
        private appCtrl: App,
        private storage: Storage,
        private platform: Platform,
        private statusBar: StatusBar,
        private splashScreen: SplashScreen,
        private scoreService: ScoreProvider
        ) {
            this.platform.ready().then(() => {

                this.statusBar.styleDefault();
                this.splashScreen.hide();

                this.scoreService.startBackgroundGeolocation();

                this.storage.get('fechaInstalacion').then(data => {
                    if (data === null) {
                        this.storage.set('fechaInstalacion', new Date());
                    }
                });

                this.storage.get('linkedUser').then((linkedUser) => {
                    if (linkedUser !== null && linkedUser.sesion) {
                        this.appCtrl.getRootNav().setRoot(TabsPage);
                    } else {
                        this.appCtrl.getRootNav().setRoot(AuthPage);
                    }
                });

            });
    }

}
