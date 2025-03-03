import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchesSectionComponent } from './matches-section.component';

describe('MatchesSectionComponent', () => {
  let component: MatchesSectionComponent;
  let fixture: ComponentFixture<MatchesSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MatchesSectionComponent]
    });
    fixture = TestBed.createComponent(MatchesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
