/* global angular, moment, dhis2 */

'use strict';

/* Services */

var resultsFrameworkServices = angular.module('resultsFrameworkServices', ['ngResource'])

.factory('RFStorageService', function(){
    var store = new dhis2.storage.Store({
        name: "dhis2rf",
        adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
        objectStores: ['dataSets', 'optionSets', 'dataElementGroups', 'dataElementGroupSets', 'indicatorGroups', 'indicatorGroupSets', 'categoryCombos', 'constants', 'attributes']
    });
    return{
        currentStore: store
    };
})

/* generate performance contract grid for the selected data set and period */
.service('GridService', function($translate){
    
    return {
        generateLayout: function( templateRows ){
            var layout = {columns: [], rows: []};
            
            layout.columns.push({id: 'frameworkColId', name: 'ASIP-2 Result', order: 0});
            layout.columns.push({id: 'indicatorColId', name: 'INDICATOR', order: 1});
            layout.columns.push({id: 'categoryColId', name: 'T/P', order: 2});
            layout.columns.push({id: 'baseLineColId', name: $translate.instant('base_line'), order: 3});
            layout.columns.push({id: 'q1Id', name: $translate.instant('q1'), order: 4});
            layout.columns.push({id: 'd2Id', name: $translate.instant('q2'), order: 5});
            layout.columns.push({id: 'q3Id', name: $translate.instant('q3'), order: 6});
            layout.columns.push({id: 'q4Id', name: $translate.instant('q4'), order: 7});
            layout.columns.push({id: 'annualTargetColId', name: $translate.instant('annual_target'), order: 8});
            layout.columns.push({id: 'finalTargetColId', name: $translate.instant('final_target'), order: 9});
            layout.columns.push({id: 'annualProgressColId', name: $translate.instant('annual_progress'), order: 10});
            
            var index = 0;
            angular.forEach(templateRows, function(r){                
                layout.rows.push({id: r.id, name: r.name, order: index});
                index++;
            });
            
            return layout;
        }
    };    
})

/* current selections */
.service('PeriodService', function(DateUtils){
    
    this.getPeriods = function(periodType, periodOffset){
        periodOffset = angular.isUndefined(periodOffset) ? 0 : periodOffset;
        var availablePeriods = [];
        if(!periodType){
            return availablePeriods;
        }        

        var pt = new PeriodType();
        var d2Periods = pt.get(periodType).generatePeriods({offset: periodOffset, filterFuturePeriods: false, reversePeriods: false});
        angular.forEach(d2Periods, function(p){
            p.endDate = DateUtils.formatFromApiToUser(p.endDate);
            p.startDate = DateUtils.formatFromApiToUser(p.startDate);
            if(moment(DateUtils.getToday()).isAfter(p.endDate)){                    
                availablePeriods.push( p );
            }
        });        
        return availablePeriods;
    };
})

/* Factory to fetch optionSets */
.factory('OptionSetService', function($q, $rootScope, RFStorageService) { 
    return {
        getAll: function(){
            
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('optionSets').done(function(optionSets){
                    $rootScope.$apply(function(){
                        def.resolve(optionSets);
                    });                    
                });
            });            
            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.get('optionSets', uid).done(function(optionSet){                    
                    $rootScope.$apply(function(){
                        def.resolve(optionSet);
                    });
                });
            });                        
            return def.promise;            
        },        
        getCode: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].name){
                        return options[i].code;
                    }
                }
            }            
            return key;
        },        
        getName: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){                    
                    if( key === options[i].code){
                        return options[i].name;
                    }
                }
            }            
            return key;
        }
    };
})


/* Factory to fetch programs */
.factory('DataSetFactory', function($q, $rootScope, $filter, SessionStorageService, RFStorageService, orderByFilter, CommonUtils) { 
  
    return {        
        getAll: function(){            
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var ou = SessionStorageService.get('SELECTED_OU');
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('dataSets').done(function(dss){
                    var dataSets = [];
                    angular.forEach(dss, function(ds){                            
                        if(ds.organisationUnits.hasOwnProperty( ou.id ) && CommonUtils.userHasValidRole(ds,'dataSets',userRoles)){
                            dataSets.push(ds);
                        }
                    });
                    $rootScope.$apply(function(){
                        def.resolve(dataSets);
                    });
                });
            });            
            return def.promise;            
        },
        get: function(uid){
            
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.get('dataSets', uid).done(function(ds){                    
                    $rootScope.$apply(function(){
                        def.resolve(ds);
                    });
                });
            });                        
            return def.promise;            
        },
        getDataSetsByOu: function(ou, selectedDataSet){
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('dataSets').done(function(dss){
                    var dataSets = [];
                    angular.forEach(dss, function(ds){                            
                        if(ds.organisationUnits.hasOwnProperty( ou.id ) && CommonUtils.userHasValidRole(ds,'dataSets', userRoles)){
                            dataSets.push(ds);
                        }
                    });
                    
                    dataSets = orderByFilter(dataSets, '-displayName').reverse();
                    
                    if(dataSets.length === 0){
                        selectedDataSet = null;
                    }
                    else if(dataSets.length === 1){
                        selectedDataSet = dataSets[0];
                    } 
                    else{
                        if(selectedDataSet){
                            var continueLoop = true;
                            for(var i=0; i<dataSets.length && continueLoop; i++){
                                if(dataSets[i].id === selectedDataSet.id){                                
                                    selectedDataSet = dataSets[i];
                                    continueLoop = false;
                                }
                            }
                            if(continueLoop){
                                selectedDataSet = null;
                            }
                        }
                    }
                                        
                    if(!selectedDataSet || angular.isUndefined(selectedDataSet) && dataSets.legth > 0){
                        selectedDataSet = dataSets[0];
                    }
                    
                    $rootScope.$apply(function(){
                        def.resolve({dataSets: dataSets, selectedDataSet: selectedDataSet});
                    });                      
                });
            });            
            return def.promise;
        },
        getBaselineDataSetsByOu: function(ou, selectedDataSet){
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('dataSets').done(function(dss){
                    dss = $filter('filter')(dss, {baseline: true});
                    var dataSets = [];
                    angular.forEach(dss, function(ds){                            
                        if(ds.organisationUnits.hasOwnProperty( ou.id ) && CommonUtils.userHasValidRole(ds,'dataSets', userRoles)){
                            dataSets.push(ds);
                        }
                    });
                    
                    dataSets = orderByFilter(dataSets, '-displayName').reverse();
                    
                    if(dataSets.length === 0){
                        selectedDataSet = null;
                    }
                    else if(dataSets.length === 1){
                        selectedDataSet = dataSets[0];
                    } 
                    else{
                        if(selectedDataSet){
                            var continueLoop = true;
                            for(var i=0; i<dataSets.length && continueLoop; i++){
                                if(dataSets[i].id === selectedDataSet.id){                                
                                    selectedDataSet = dataSets[i];
                                    continueLoop = false;
                                }
                            }
                            if(continueLoop){
                                selectedDataSet = null;
                            }
                        }
                    }
                                        
                    if(!selectedDataSet || angular.isUndefined(selectedDataSet) && dataSets.legth > 0){
                        selectedDataSet = dataSets[0];
                    }
                    
                    $rootScope.$apply(function(){
                        def.resolve({dataSets: dataSets, selectedDataSet: selectedDataSet});
                    });                      
                });
            });            
            return def.promise;
        }
    };
})


/* factory to fetch and process programValidations */
.factory('MetaDataFactory', function($q, $rootScope, RFStorageService, orderByFilter) {  
    
    return {        
        get: function(store, uid){
            
            var def = $q.defer();
            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.get(store, uid).done(function(pv){                    
                    $rootScope.$apply(function(){
                        def.resolve(pv);
                    });
                });
            });                        
            return def.promise;
        },
        getAll: function(store){
            var def = $q.defer();            
            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll(store).done(function(objs){                    
                    objs = orderByFilter(objs, '-name').reverse();                    
                    $rootScope.$apply(function(){
                        def.resolve(objs);
                    });
                });                
            });            
            return def.promise;
        }
    };        
})

.factory('ResultsFrameworkFactory', function($http, DialogService, $translate) {   
    
    var errorNotifier = function(response){
        if( response && response.data && response.data.status === 'ERROR'){
            var dialogOptions = {
                headerText: response.data.status,
                bodyText: response.data.message ? response.data.message : $translate.instant('unable_to_fetch_data_from_server')
            };		
            DialogService.showDialog({}, dialogOptions);
        }
    };
    
    return {
        
        get: function(uid){            
            var promise = $http.get('../api/resultsFrameworks/' + uid + '.json?fields=id,name,code,description,active,impacts[id,name,indicators[name]],outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],programms[id,name,code,description,outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],subProgramms[id,name,code,description,outputs[id,name,indicators[name]]]]').then(function(response){               
                return response.data;
            }, function(response){
                errorNotifier(response);
            });            
            return promise;
        },
        getAll: function(){            
            var promise = $http.get('../api/resultsFrameworks.json?fields=id,name,code,description,active,impacts[id,name],outcomes[id,name],outputs[id,name],programms[id,name,code,description,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,description,outputs[id,name]]]&paging=false').then(function(response){               
                return response.data;
            }, function(response){
                errorNotifier(response);
            });            
            return promise;
        },
        create: function(resultsFramework){    
            var promise = $http.post('../api/resultsFrameworks.json', resultsFramework).then(function(response){
                return response.data;           
            });
            return promise;            
        },
        delete: function(resultsFramework){
            var promise = $http.delete('../api/resultsFrameworks/' + resultsFramework.id).then(function(response){
                return response.data;               
            });
            return promise;           
        },
        update: function(resultsFramework){   
            var promise = $http.put('../api/resultsFrameworks/' + resultsFramework.id, resultsFramework).then(function(response){
                return response.data;         
            });
            return promise;
        }
    };    
});