'use strict';

describe('Service: taskExecutor', function () {

  //NOTE: This is only testing the service dependencies. Please add more tests.

  var taskExecutor;

  beforeEach(
    module('deckApp.taskExecutor.service')
  );

  beforeEach(
    inject(function (_taskExecutor_) {
      taskExecutor = _taskExecutor_;
    })
  );

  it('should instantiate the controller', function () {
    expect(taskExecutor).toBeDefined();
  });
});


