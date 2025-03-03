// shop-preview.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shop-preview',
  templateUrl: './shop-preview.component.html',
  styleUrls: ['./shop-preview.component.css']
})
export class ShopPreviewComponent {
  products = [
    { name: 'Maglia Ufficiale', imageUrl: 'assets/shop/lebron.jpg' },
    { name: 'Pantaloncini', imageUrl: 'assets/shop/hoodie.jpg' },
    { name: 'Borraccia', imageUrl: 'assets/shop/bott.jpg' },
    
  ];
  constructor(private router: Router){}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}