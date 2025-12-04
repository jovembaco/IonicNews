import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private readonly _selectedCurrencies = new BehaviorSubject<{ from: string, to: string }>({ from: '', to: '' });
  readonly selectedCurrencies$ = this._selectedCurrencies.asObservable();

  constructor() { }

  setSelectedCurrencies(from: string, to: string) {
    this._selectedCurrencies.next({ from, to });
  }
}
