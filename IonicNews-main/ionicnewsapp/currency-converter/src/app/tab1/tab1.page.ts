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

  constructor(
    private currencyApi: CurrencyApiService,
    private toastController: ToastController,
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
    this.resultado = undefined;

    if (!this.valor || !this.moedaDe || !this.moedaPara) {
      this.mostrarAviso('Por favor, preencha todos os campos.');
      return;
    }

    this.stateService.setSelectedCurrencies(this.moedaDe, this.moedaPara);
    this.isLoading = true;

    try {
      // --- MUDANÇA AQUI: Chamada à AWS Lambda ---
      // O frontend envia os dados e espera a nuvem responder com o cálculo pronto
      const data = await this.currencyApi.converterViaAWS(this.valor, this.moedaDe, this.moedaPara);
      
      if (data.sucesso) {
        // A AWS já devolve o valor calculado
        this.resultado = data.resultado;
        
        // Salvamos no histórico local para aparecer na Tab2
        // (Nota: O histórico "real" e seguro já foi salvo no DynamoDB pela Lambda!)
        this.guardarNoHistorico(); 
        
        this.mostrarAviso('Cálculo feito na AWS e salvo no DynamoDB!', 'success');
      } else {
        this.mostrarAviso('A AWS retornou um erro: ' + (data.erro || 'Desconhecido'), 'danger');
      }

    } catch (error) {
      this.mostrarAviso('Falha ao conectar com a Nuvem AWS.', 'danger');
      console.error('Falha:', error);
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
}
