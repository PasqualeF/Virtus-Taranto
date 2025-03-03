import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UltimissimeComponent } from './ultimissime.component';

describe('UltimissimeComponent', () => {
  let component: UltimissimeComponent;
  let fixture: ComponentFixture<UltimissimeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UltimissimeComponent]
    });
    fixture = TestBed.createComponent(UltimissimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
