import { Component } from '@angular/core';
import { UserPage } from '../user/user';
import { SurveyPage } from '../survey/survey';
import { MedicalPage } from '../medical/medical';

@Component({
	templateUrl: 'tabs.html'
})

export class TabsPage {
	user = UserPage;
	survey = SurveyPage;
    medical = MedicalPage;
	constructor() {}
}
