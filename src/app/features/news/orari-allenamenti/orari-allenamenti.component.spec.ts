import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrariAllenamentiComponent } from './orari-allenamenti.component';

describe('OrariAllenamentiComponent', () => {
  let component: OrariAllenamentiComponent;
  let fixture: ComponentFixture<OrariAllenamentiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrariAllenamentiComponent]
    });
    fixture = TestBed.createComponent(OrariAllenamentiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
