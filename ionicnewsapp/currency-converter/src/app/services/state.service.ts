import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  // Um BehaviorSubject guarda o valor mais recente e emite-o para novos subscritores.
  private readonly _selectedCurrencies = new BehaviorSubject<{ from: string, to: string }>({ from: '', to: '' });

  // Expomos o BehaviorSubject como um Observable (só de leitura) para os outros componentes.
  readonly selectedCurrencies$ = this._selectedCurrencies.asObservable();

  constructor() { }

  /**
   * Atualiza as moedas selecionadas e notifica todos os componentes que estão a "ouvir".
   * @param from - O código da moeda de origem.
   * @param to - O código da moeda de destino.
   */
  setSelectedCurrencies(from: string, to: string) {
    this._selectedCurrencies.next({ from, to });
  }
}
