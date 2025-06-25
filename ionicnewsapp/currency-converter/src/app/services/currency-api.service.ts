// CÓDIGO PARA: src/app/services/currency-api.service.ts
// ATUALIZADO para remover a função de histórico, que não é suportada no plano gratuito.

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyApiService {

  private apiKey = '673f93b4b57bf38c3b5617e2'; 
  private apiUrl = 'https://v6.exchangerate-api.com/v6/';

  constructor() { }
  
  // A função getHistoricalRates foi removida.

  async getLatestRates(baseCurrency: string): Promise<any> {
    if (this.apiKey === 'SUA_CHAVE_DA_API_AQUI' || this.apiKey.length < 16) {
      const errorMessage = 'API Key parece estar em falta ou incorreta no ficheiro currency-api.service.ts';
      alert(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const response = await fetch(`${this.apiUrl}${this.apiKey}/latest/${baseCurrency}`);
      if (!response.ok) {
        console.warn('Falha na rede. A tentar usar dados offline.');
        return this.getOfflineRates(baseCurrency);
      }
      const data = await response.json();
      if (data.result === 'error') {
        throw new Error(`Erro da API: ${data['error-type']}`);
      }
      
      localStorage.setItem(`taxas_cambio_${baseCurrency}`, JSON.stringify(data));
      // Adiciona a data atual aos dados para referência futura, se necessário.
      data.last_updated = new Date().toISOString(); 
      return data;

    } catch (error) {
      console.error('Falha na chamada à API. A tentar usar dados offline.', error);
      return this.getOfflineRates(baseCurrency);
    }
  }

  private getOfflineRates(baseCurrency: string): Promise<any> {
    const taxasGuardadas = localStorage.getItem(`taxas_cambio_${baseCurrency}`);
    if (taxasGuardadas) {
      console.log('A usar taxas de câmbio guardadas (offline).');
      const data = JSON.parse(taxasGuardadas);
      data.offline = true; 
      return Promise.resolve(data);
    } else {
      console.error('Não foi possível obter dados online nem offline.');
      return Promise.reject('Sem dados offline disponíveis.');
    }
  }
}
