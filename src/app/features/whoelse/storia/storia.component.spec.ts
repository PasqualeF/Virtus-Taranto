import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoriaComponent } from './storia.component';

describe('StoriaComponent', () => {
  let component: StoriaComponent;
  let fixture: ComponentFixture<StoriaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StoriaComponent]
    });
    fixture = TestBed.createComponent(StoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
