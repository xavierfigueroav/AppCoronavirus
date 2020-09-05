import { Component, ViewChild, ElementRef, Input } from '@angular/core';

import { Chart } from 'chart.js';
/**
 * Generated class for the BarPlotComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'bar-plot',
  templateUrl: 'bar-plot.html'
})
export class BarPlotComponent {

    @ViewChild('canvas') canvas: ElementRef;
    @Input() data: any[];
    @Input() parameter: string;
    chart: Chart;
    loading: boolean;

    constructor() { }

    ngOnChanges() {
        if (this.canvas !== undefined) {
            this.loading = true;
            this.generateGraph().then(() => {
                this.loading = false;
            });
        }
    }

    transform(data: any[], parameter: string) {

        const transformed = [];

        // data.forEach(measure => {
        //     if (area == 'NACIONAL' || measure['CANTON'] === area || measure['PROVINCIA'] === area) {
        //         transformed.push({x: measure['RANGO EDAD']*1000, y: measure[parameter]});
        //     }
        // });
        return data.map(measure => { return {x: measure['RANGO EDAD'], y: measure[parameter]}; });
    }

    async generateGraph() {
        const chartData = this.transform(this.data, this.parameter);

        this.chart = new Chart(this.canvas.nativeElement, {
            type: 'bar',
            data: {
                labels: chartData.map(measure => measure.x),
                datasets: [
                    {
                        label: this.parameter,
                        backgroundColor: 'RGBA(15, 157, 88, 1)',
                        data: chartData.map(measure => measure.y)
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{ ticks: { beginAtZero: true } }]
                },
                legend: { display: false }
            }
        });
    }

}
