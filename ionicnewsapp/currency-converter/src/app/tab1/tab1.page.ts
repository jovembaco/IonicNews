import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, 
  IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, 
  IonIcon
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { swapVerticalOutline } from 'ionicons/icons';

import { CurrencyApiService } from '../services/currency-api.service';
// ✨ NOVO: Importa o serviço de estado.
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, 
    IonSpinner, IonIcon
  ],
})
export class Tab1Page {

  public moedas = [
    { codigo: 'USD', nome: 'Dólar Americano', pais: 'Estados Unidos' },
    { codigo: 'EUR', nome: 'Euro', pais: 'maioria dos países da Europa' },
    { codigo: 'BRL', nome: 'Real Brasileiro', pais: 'Brasil' },
    { codigo: 'JPY', nome: 'Iene Japonês', pais: 'Japão' },
    { codigo: 'GBP', nome: 'Libra Esterlina', pais: 'Reino Unido' },
  ];

  public valor?: number;
  public moedaDe?: string;
  public moedaPara?: string;
  public resultado?: number;
  public isLoading: boolean = false;
  public dicaDeGasto: string = '';

  constructor(
    private currencyApi: CurrencyApiService,
    private toastController: ToastController,
    // ✨ NOVO: Injeta o serviço de estado para que possamos usá-lo.
    private stateService: StateService
  ) {
    addIcons({ swapVerticalOutline });
  }

  inverterMoedas() {
    const temp = this.moedaDe;
    this.moedaDe = this.moedaPara;
    this.moedaPara = temp;
    if (this.valor) {
      this.converterMoeda();
    }
  }

  async converterMoeda() {
    this.dicaDeGasto = '';
    this.resultado = undefined;

    if (!this.valor || !this.moedaDe || !this.moedaPara) {
      this.mostrarAviso('Por favor, preencha todos os campos.');
      return;
    }

    // ✨ NOVO: Informa o serviço de estado sobre as moedas atuais antes de converter.
    this.stateService.setSelectedCurrencies(this.moedaDe, this.moedaPara);

    this.isLoading = true;

    try {
      const data = await this.currencyApi.getLatestRates(this.moedaDe);
      const taxaDeConversao = data.conversion_rates[this.moedaPara];
      
      if (taxaDeConversao) {
        this.resultado = this.valor * taxaDeConversao;
        this.guardarNoHistorico();
        if (data.offline) {
          this.mostrarAviso('Está offline. A conversão usou as últimas taxas guardadas.', 'warning');
        }
      } else {
        this.mostrarAviso('Não foi possível encontrar a taxa de conversão.', 'danger');
      }

    } catch (error) {
      this.mostrarAviso('Falha ao converter. Sem ligação e sem dados offline.', 'danger');
      console.error('Falha ao converter moeda:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  async mostrarAviso(mensagem: string, cor: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'top',
      color: cor
    });
    toast.present();
  }
  
  guardarNoHistorico() {
    if (!this.valor || !this.resultado) return;
    const novaEntrada = {
      data: new Date().toISOString(), valor: this.valor, moedaDe: this.moedaDe,
      resultado: this.resultado, moedaPara: this.moedaPara
    };
    const historico = JSON.parse(localStorage.getItem('historico_conversoes') || '[]');
    historico.unshift(novaEntrada);
    localStorage.setItem('historico_conversoes', JSON.stringify(historico));
  }

  async obterDicaDeGasto() {
    if (!this.resultado || !this.moedaPara) return;

    this.isLoading = true;
    this.dicaDeGasto = '';

    const paisDestino = this.moedas.find(m => m.nome.toLowerCase().includes('real')) ? 'Brasil' : 'outro país';
    const prompt = `Estou a viajar para ${paisDestino}. O que eu consigo comprar ou fazer com aproximadamente ${this.resultado.toFixed(2)} ${this.moedaPara}? Me dê 2 ou 3 exemplos práticos, curiosos e úteis. Responda em um único parágrafo e em português do Brasil.`;

    try {
      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.candidates?.length > 0 && result.candidates[0].content?.parts?.length > 0) {
        this.dicaDeGasto = result.candidates[0].content.parts[0].text;
      } else {
        this.dicaDeGasto = "Não foi possível obter uma sugestão neste momento.";
      }

    } catch (error) {
      this.mostrarAviso('Não foi possível obter a dica do Gemini. Verifique a sua ligação.', 'danger');
      console.error('Erro ao chamar a API do Gemini:', error);
    } finally {
      this.isLoading = false;
    }
  }
}