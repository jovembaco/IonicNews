import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

import { StateService } from '../services/state.service';
import { CurrencyApiService } from '../services/currency-api.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner]
})
export class Tab3Page implements OnDestroy {
  @ViewChild('currencyChart') private chartCanvas: ElementRef | undefined;

  public chart: Chart | undefined;
  public chartTitle = 'Faça uma conversão para começar';
  public isLoading = false;
  
  private stateSubscription: Subscription | undefined;

  constructor(
    private stateService: StateService,
    private currencyApi: CurrencyApiService
  ) {
    Chart.register(...registerables);
  }

  ionViewWillEnter() {
    this.stateSubscription?.unsubscribe(); 
    
    this.stateSubscription = this.stateService.selectedCurrencies$.subscribe(currencies => {
      if (currencies && currencies.from && currencies.to) {
        this.chartTitle = `Variação de ${currencies.from} para ${currencies.to}`;
        this.loadChartData(currencies.from, currencies.to);
      }
    });
  }

  ionViewDidLeave() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  async loadChartData(from: string, to: string) {
    if (this.isLoading) return;

    this.isLoading = true;
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined; 
    }
    
    try {
      // 1. Busca a taxa de câmbio MAIS RECENTE para usar como base para a simulação.
      const latestData = await this.currencyApi.getLatestRates(from);
      const latestRate = latestData.conversion_rates[to];

      if (!latestRate) {
        throw new Error('Não foi possível obter a taxa de câmbio base para a simulação.');
      }
      
      const labels: string[] = [];
      const dataPoints: number[] = [];

      // 2. Cria 7 dias de dados fictícios baseados na taxa atual.
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
        
        // Gera uma pequena variação aleatória (-3% a +3%) em relação à taxa base.
        const variation = (Math.random() - 0.5) * 0.06;
        const simulatedRate = latestRate * (1 + variation);
        dataPoints.push(simulatedRate);
      }
      
      setTimeout(() => this.createChart(labels, dataPoints), 50);

    } catch(error) {
      console.error("[Tab 3] ERRO ao carregar/simular os dados do gráfico:", error);
    } finally {
      this.isLoading = false;
    }
  }

  createChart(labels: string[], dataPoints: number[]) {
    if (!this.chartCanvas) {
      console.error('[Tab 3] ERRO CRÍTICO: Elemento canvas do gráfico não foi encontrado!');
      return;
    }

    const canvas = this.chartCanvas.nativeElement;
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Taxa de Câmbio (Simulada)',
          data: dataPoints,
          borderColor: 'rgb(66, 159, 226)',
          backgroundColor: 'rgba(66, 159, 226, 0.2)',
          fill: true,
          tension: 0.1
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: false } } }
    });
  }
}
