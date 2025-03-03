import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalestreComponent } from './palestre.component';

describe('PalestreComponent', () => {
  let component: PalestreComponent;
  let fixture: ComponentFixture<PalestreComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PalestreComponent]
    });
    fixture = TestBed.createComponent(PalestreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
