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
    console.log('[Tab 3] Construtor foi chamado.');
  }

  ionViewWillEnter() {
    console.log('[Tab 3] Vai entrar na view (ionViewWillEnter).');
    this.stateSubscription?.unsubscribe(); 
    
    this.stateSubscription = this.stateService.selectedCurrencies$.subscribe(currencies => {
      console.log('[Tab 3] StateService emitiu novas moedas:', currencies);
      if (currencies && currencies.from && currencies.to) {
        this.chartTitle = `Variação de ${currencies.from} para ${currencies.to}`;
        this.loadChartData(currencies.from, currencies.to);
      }
    });
  }

  ionViewDidLeave() {
    console.log('[Tab 3] Saiu da view (ionViewDidLeave). A destruir o gráfico.');
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  async loadChartData(from: string, to: string) {
    if (this.isLoading) {
      console.log('[Tab 3] Já está a carregar dados, a nova chamada foi ignorada.');
      return;
    }

    console.log(`[Tab 3] A carregar dados do gráfico para ${from} -> ${to}`);
    this.isLoading = true;
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined; 
    }
    
    const labels: string[] = [];
    const dataPoints: number[] = [];

    try {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        console.log(`[Tab 3] A buscar dados para ${day}/${month}/${year}`);
        const historicalData = await this.currencyApi.getHistoricalRates(from, year, month, day);
        const rate = historicalData.conversion_rates[to];
        
        labels.push(`${day}/${month}`);
        dataPoints.push(rate);
      }
      
      console.log('[Tab 3] Dados recebidos. A criar o gráfico com:', { labels, dataPoints });
      setTimeout(() => this.createChart(labels, dataPoints), 50);

    } catch(error) {
      console.error("[Tab 3] ERRO ao carregar os dados do gráfico:", error);
    } finally {
      this.isLoading = false;
    }
  }

  createChart(labels: string[], dataPoints: number[]) {
    if (!this.chartCanvas) {
      console.error('[Tab 3] ERRO CRÍTICO: Elemento canvas do gráfico não foi encontrado!');
      return;
    }

    console.log('[Tab 3] Elemento canvas encontrado. A desenhar o gráfico...');
    const canvas = this.chartCanvas.nativeElement;
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Taxa de Câmbio',
          data: dataPoints,
          borderColor: 'rgb(66, 159, 226)',
          backgroundColor: 'rgba(66, 159, 226, 0.2)',
          fill: true,
          tension: 0.1
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: false } } }
    });
    console.log('[Tab 3] Gráfico desenhado com sucesso!');
  }
}
