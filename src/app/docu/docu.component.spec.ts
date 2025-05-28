import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocuComponent } from './docu.component';

describe('DocuComponent', () => {
  let component: DocuComponent;
  let fixture: ComponentFixture<DocuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
