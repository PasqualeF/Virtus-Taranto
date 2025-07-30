import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PalestrePreviewComponent } from './palestre-preview.component';

describe('PalestrePreviewComponent', () => {
  let component: PalestrePreviewComponent;
  let fixture: ComponentFixture<PalestrePreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PalestrePreviewComponent]
    });
    fixture = TestBed.createComponent(PalestrePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
