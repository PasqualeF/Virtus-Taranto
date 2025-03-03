import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IscrizioniGiovaniliComponent } from './iscrizioni-giovanili.component';

describe('IscrizioniGiovaniliComponent', () => {
  let component: IscrizioniGiovaniliComponent;
  let fixture: ComponentFixture<IscrizioniGiovaniliComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IscrizioniGiovaniliComponent]
    });
    fixture = TestBed.createComponent(IscrizioniGiovaniliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
