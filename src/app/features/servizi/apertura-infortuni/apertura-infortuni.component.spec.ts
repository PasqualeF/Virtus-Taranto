import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AperturaInfortuniComponent } from './apertura-infortuni.component';

describe('AperturaInfortuniComponent', () => {
  let component: AperturaInfortuniComponent;
  let fixture: ComponentFixture<AperturaInfortuniComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AperturaInfortuniComponent]
    });
    fixture = TestBed.createComponent(AperturaInfortuniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
