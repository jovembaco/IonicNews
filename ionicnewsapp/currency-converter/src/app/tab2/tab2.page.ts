// CÓDIGO PARA: src/app/tab2/tab2.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonButton, IonIcon]
})
export class Tab2Page {

  public historico: any[] = [];

  constructor() {
    // Adiciona o ícone de lixeira para que ele possa ser usado no HTML
    addIcons({ trashOutline });
  }

  // Esta função é executada sempre que o utilizador entra nesta aba
  ionViewWillEnter() {
    this.carregarHistorico();
  }

  carregarHistorico() {
    // Lê o histórico do localStorage e guarda-o na variável local
    this.historico = JSON.parse(localStorage.getItem('historico_conversoes') || '[]');
  }

  limparHistorico() {
    // Remove o item do localStorage
    localStorage.removeItem('historico_conversoes');
    // Atualiza a lista na tela
    this.carregarHistorico();
  }
}
