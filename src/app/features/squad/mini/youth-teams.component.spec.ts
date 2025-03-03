import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YouthTeamsComponent } from './youth-teams.component';

describe('YouthTeamsComponent', () => {
  let component: YouthTeamsComponent;
  let fixture: ComponentFixture<YouthTeamsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [YouthTeamsComponent]
    });
    fixture = TestBed.createComponent(YouthTeamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
