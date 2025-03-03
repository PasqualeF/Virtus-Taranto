import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitaMedicaComponent } from './visita-medica.component';

describe('VisitaMedicaComponent', () => {
  let component: VisitaMedicaComponent;
  let fixture: ComponentFixture<VisitaMedicaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisitaMedicaComponent]
    });
    fixture = TestBed.createComponent(VisitaMedicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
