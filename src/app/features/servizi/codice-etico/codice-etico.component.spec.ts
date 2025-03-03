import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodiceEticoComponent } from './codice-etico.component';

describe('CodiceEticoComponent', () => {
  let component: CodiceEticoComponent;
  let fixture: ComponentFixture<CodiceEticoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CodiceEticoComponent]
    });
    fixture = TestBed.createComponent(CodiceEticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
