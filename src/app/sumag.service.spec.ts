import { TestBed } from '@angular/core/testing';

import { SumagService } from './sumag.service';

describe('SumagService', () => {
  let service: SumagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SumagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
