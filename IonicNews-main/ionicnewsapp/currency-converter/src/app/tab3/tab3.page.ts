import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

import { StateService } from '../services/state.service';
import { CurrencyApiService } from '../services/currency-api.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonSpinner
  ]
})
export class Tab3Page implements OnDestroy {
  @ViewChild('currencyChart') private chartCanvas: ElementRef | undefined;

  public chart: Chart | undefined;
  public chartTitle = 'Faça uma conversão para começar';
  public isLoading = false;
  
  private stateSubscription: Subscription | undefined;

  constructor(
    private stateService: StateService,
    private currencyApi: CurrencyApiService,
    private toastCtrl: ToastController
  ) {
    Chart.register(...registerables);
  }

  ionViewWillEnter() {
    this.stateSubscription?.unsubscribe(); 
    
    this.stateSubscription = this.stateService.selectedCurrencies$.subscribe((currencies: { from: string, to: string }) => {
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
    
    // Limpa o gráfico antigo para evitar sobreposição
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined; 
    }
    
    // Valor padrão caso tudo falhe (fallback)
    let baseRateForSimulation = 1.0;
    let isDataValid = false;

    try {
      const latestData = await this.currencyApi.getLatestRates(from);
      console.log('Resposta da API:', latestData); 

      // --- CENÁRIO 1: SEM CONEXÃO / OFFLINE ---
      if (latestData && latestData.offline === true) {
        this.presentToast('Sem conexão. Exibindo gráfico simulado (ilustrativo).');
      } 
      // --- CENÁRIO 2: ERRO NA API (DADOS FALTANDO) ---
      else if (!latestData || !latestData.conversion_rates) {
        console.warn('API retornou dados inválidos, usando fallback.');
        this.presentToast('Erro na API. Exibindo gráfico simulado.');
      } 
      // --- CENÁRIO 3: SUCESSO ---
      else {
        const rate = latestData.conversion_rates[to];
        if (rate !== undefined && rate !== null) {
          baseRateForSimulation = rate;
          isDataValid = true;
        } else {
          this.presentToast(`Taxa para ${to} não encontrada. Simulando...`);
        }
      }

    } catch(error) {
      console.error("[Tab 3] Erro na requisição:", error);
      this.presentToast('Erro de conexão. Exibindo gráfico simulado.');
    }

    // --- GERAÇÃO DO GRÁFICO (SEMPRE ACONTECE) ---
    // Se deu erro, usa 1.0. Se deu certo, usa o valor da moeda.
    
    const labels: string[] = [];
    const dataPoints: number[] = [];

    // Gera dados simulados para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      
      const variation = (Math.random() - 0.5) * 0.06; // Variação de +/- 3%
      const simulatedRate = baseRateForSimulation * (1 + variation);
      dataPoints.push(simulatedRate);
    }
    
    this.isLoading = false; // Desliga o spinner
    
    // Delay para garantir que o HTML do canvas renderizou
    setTimeout(() => this.createChart(labels, dataPoints, isDataValid), 50);
  }

  createChart(labels: string[], dataPoints: number[], isRealData: boolean) {
    if (!this.chartCanvas) return;

    const canvas = this.chartCanvas.nativeElement;
    
    // Se os dados não forem reais, mudamos a cor para indicar (ex: laranja)
    // Se forem reais, usamos o azul padrão
    const graphColor = isRealData ? 'rgb(66, 159, 226)' : 'rgb(255, 159, 64)'; 
    const bgColor = isRealData ? 'rgba(66, 159, 226, 0.2)' : 'rgba(255, 159, 64, 0.2)';

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: isRealData ? 'Taxa de Câmbio (Simulada)' : 'Modo Offline (Simulado)',
          data: dataPoints,
          borderColor: graphColor,
          backgroundColor: bgColor,
          fill: true,
          tension: 0.4
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: false } } 
      }
    });
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}