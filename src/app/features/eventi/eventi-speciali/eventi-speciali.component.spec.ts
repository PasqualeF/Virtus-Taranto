import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventiSpecialiComponent } from './eventi-speciali.component';

describe('EventiSpecialiComponent', () => {
  let component: EventiSpecialiComponent;
  let fixture: ComponentFixture<EventiSpecialiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventiSpecialiComponent]
    });
    fixture = TestBed.createComponent(EventiSpecialiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
