'use strict';

import { SECURITY_GROUP_FILTER_SERVICE } from './securityGroupFilter.service';

// Most of this logic has been moved to filter.model.service.js, so these act more as integration tests
describe('Service: securityGroupFilterService', function() {
  var service;
  var securityGroupFilterModel;
  var app;
  var resultJson;

  beforeEach(function() {
    window.module(SECURITY_GROUP_FILTER_SERVICE);
    window.inject(function(securityGroupFilterService, _securityGroupFilterModel_) {
      service = securityGroupFilterService;
      securityGroupFilterModel = _securityGroupFilterModel_;
    });
  });

  beforeEach(function() {
    app = {
      securityGroups: {
        data: [
          { name: 'sg-1', region: 'us-east-1', account: 'test', vpcName: '', usages: {} },
          { name: 'sg-1', region: 'us-west-1', account: 'test', vpcName: 'main', usages: {} },
          { name: 'sg-2', region: 'us-east-1', account: 'prod', vpcName: '', usages: {} },
        ],
      },
    };
    resultJson = [
      { heading: 'us-east-1', vpcName: '', securityGroup: app.securityGroups.data[0] },
      { heading: 'us-west-1 (main)', vpcName: 'main', securityGroup: app.securityGroups.data[1] },
      { heading: 'us-east-1', vpcName: '', securityGroup: app.securityGroups.data[2] },
    ];
    securityGroupFilterModel.clearFilters();
  });

  describe('Updating the security group group', function() {
    it('no filter: should be transformed', function() {
      var expected = [
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ];
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual(expected);
    });

    describe('filter by search', function() {
      it('should add searchField when filter is not prefixed with vpc:', function() {
        expect(app.securityGroups.data.length).toBe(3);
        app.securityGroups.data.forEach(group => {
          expect(group.searchField).toBeUndefined();
        });
        securityGroupFilterModel.sortFilter.filter = 'main';
        service.updateSecurityGroups(app);
        app.securityGroups.data.forEach(group => {
          expect(group.searchField).not.toBeUndefined();
        });
      });
    });

    describe('filter by vpc', function() {
      it('should filter by vpc name as an exact match', function() {
        securityGroupFilterModel.sortFilter.filter = 'vpc:main';
        service.updateSecurityGroups(app);
        expect(securityGroupFilterModel.groups).toEqual([
          {
            heading: 'test',
            subgroups: [{ heading: 'sg-1', subgroups: [resultJson[1]] }],
          },
        ]);
      });

      it('should not match on partial vpc name', function() {
        securityGroupFilterModel.sortFilter.filter = 'vpc:main-old';
        service.updateSecurityGroups(app);
        expect(securityGroupFilterModel.groups).toEqual([]);
      });
    });

    describe('filtering by account type', function() {
      it('1 account filter: should be transformed showing only prod accounts', function() {
        securityGroupFilterModel.sortFilter.account = { prod: true };
        service.updateSecurityGroups(app);
        expect(securityGroupFilterModel.groups).toEqual([
          {
            heading: 'prod',
            subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
          },
        ]);
      });

      it('All account filters: should show all accounts', function() {
        securityGroupFilterModel.sortFilter.account = { prod: true, test: true };
        service.updateSecurityGroups(app);
        expect(securityGroupFilterModel.groups).toEqual([
          {
            heading: 'prod',
            subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
          },
          {
            heading: 'test',
            subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
          },
        ]);
      });
    });
  });

  describe('filter by region', function() {
    it('1 region: should filter by that region', function() {
      securityGroupFilterModel.sortFilter.region = { 'us-east-1': true };

      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0]] }],
        },
      ]);
    });

    it('All regions: should show all load balancers', function() {
      securityGroupFilterModel.sortFilter.region = { 'us-east-1': true, 'us-west-1': true };

      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ]);
    });
  });

  describe('filtered by provider type', function() {
    beforeEach(function() {
      app.securityGroups.data[0].provider = 'aws';
      app.securityGroups.data[1].provider = 'gce';
      app.securityGroups.data[2].provider = 'aws';
    });
    it('should filter by aws if checked', function() {
      securityGroupFilterModel.sortFilter.providerType = { aws: true };
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0]] }],
        },
      ]);
    });

    it('should not filter if no provider type is selected', function() {
      securityGroupFilterModel.sortFilter.providerType = undefined;
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ]);
    });

    it('should not filter if all provider are selected', function() {
      securityGroupFilterModel.sortFilter.providerType = { aws: true, gce: true };
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ]);
    });
  });

  describe('group diffing', function() {
    beforeEach(function() {
      app.securityGroups.data[0].stringVal = 'original';
      app.securityGroups.data[1].stringVal = 'should be deleted';
      securityGroupFilterModel.groups = [
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ];
    });

    it('adds a group when new one provided', function() {
      app.securityGroups.data.push({
        name: 'sg-1',
        account: 'management',
        region: 'us-east-1',
        vpcName: '',
      });
      var newGroup = {
        heading: 'management',
        subgroups: [
          {
            heading: 'sg-1',
            subgroups: [{ heading: 'us-east-1', vpcName: '', securityGroup: app.securityGroups.data[3] }],
          },
        ],
      };
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        newGroup,
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ]);
    });

    it('adds a subgroup when new one provided', function() {
      app.securityGroups.data.push({
        name: 'sg-3',
        account: 'prod',
        region: 'eu-west-1',
        vpcName: '',
      });
      var newSubGroup = {
        heading: 'sg-3',
        subgroups: [{ heading: 'eu-west-1', vpcName: '', securityGroup: app.securityGroups.data[3] }],
      };
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }, newSubGroup],
        },
        {
          heading: 'test',
          subgroups: [{ heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] }],
        },
      ]);
    });

    it('adds a sub-subgroup when new one provided', function() {
      app.securityGroups.data.push({
        name: 'sg-2',
        account: 'test',
        region: 'eu-west-1',
        vpcName: '',
      });
      var newSubsubGroup = { heading: 'eu-west-1', vpcName: '', securityGroup: app.securityGroups.data[3] };
      service.updateSecurityGroups(app);
      expect(securityGroupFilterModel.groups).toEqual([
        {
          heading: 'prod',
          subgroups: [{ heading: 'sg-2', subgroups: [resultJson[2]] }],
        },
        {
          heading: 'test',
          subgroups: [
            { heading: 'sg-1', subgroups: [resultJson[0], resultJson[1]] },
            { heading: 'sg-2', subgroups: [newSubsubGroup] },
          ],
        },
      ]);
    });
  });
});
