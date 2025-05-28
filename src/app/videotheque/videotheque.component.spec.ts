import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideothequeComponent } from './videotheque.component';

describe('VideothequeComponent', () => {
  let component: VideothequeComponent;
  let fixture: ComponentFixture<VideothequeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideothequeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideothequeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
