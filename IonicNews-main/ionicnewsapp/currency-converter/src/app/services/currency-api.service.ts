import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyApiService {

  //FUNCTION URL DA AWS
  private awsUrl = 'https://tqgnlgxt2op2heu3dklxo62aem0omadr.lambda-url.us-east-2.on.aws/'; 

  constructor() { }

  // Esta função envia os dados para a nuvem AWS processar
  async converterViaAWS(amount: number, from: string, to: string): Promise<any> {
    try {
      // 1. Prepara o pacote de dados para enviar
      const payload = {
        amount: amount,
        from: from,
        to: to
      };

      // 2. Faz o pedido (POST) para a Lambda
      const response = await fetch(this.awsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro ao comunicar com o servidor AWS');
      }

      // 3. Devolve a resposta da Lambda (que contém o resultado e a confirmação do DynamoDB)
      return await response.json();

    } catch (error) {
      console.error('Erro no serviço de nuvem:', error);
      throw error;
    }
  }
  
  // Mantemos o método antigo apenas para não partir o código se for chamado em outro lugar,
  // mas ele não será usado na conversão principal.
  getLatestRates(baseCurrency: string): Promise<any> {
      return Promise.resolve({ offline: true }); 
  }
}