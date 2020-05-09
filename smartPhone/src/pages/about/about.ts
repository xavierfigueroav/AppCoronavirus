import { Component } from '@angular/core';
import { App } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';

/**
 * Generated class for the AboutPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
    selector: 'page-about',
    templateUrl: 'about.html',
})
export class AboutPage {

    constructor(private app: App, private storage: StorageProvider) {
    }

    cerrarSesion() {
        this.storage.setUser(null).then(() => {
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

}
