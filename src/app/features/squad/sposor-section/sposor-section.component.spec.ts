import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SposorSectionComponent } from './sposor-section.component';

describe('SposorSectionComponent', () => {
  let component: SposorSectionComponent;
  let fixture: ComponentFixture<SposorSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SposorSectionComponent]
    });
    fixture = TestBed.createComponent(SposorSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
