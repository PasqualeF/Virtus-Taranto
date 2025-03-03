import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComunicazioniComponent } from './comunicazioni.component';

describe('ComunicazioniComponent', () => {
  let component: ComunicazioniComponent;
  let fixture: ComponentFixture<ComunicazioniComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComunicazioniComponent]
    });
    fixture = TestBed.createComponent(ComunicazioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
