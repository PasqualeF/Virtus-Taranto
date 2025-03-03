import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganigrammaComponent } from './organigramma.component';

describe('OrganigrammaComponent', () => {
  let component: OrganigrammaComponent;
  let fixture: ComponentFixture<OrganigrammaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrganigrammaComponent]
    });
    fixture = TestBed.createComponent(OrganigrammaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
