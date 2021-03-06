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
.factory('DataSetFactory', function($q, $rootScope, SessionStorageService, RFStorageService, orderByFilter, CommonUtils) {

    return {
        getAll: function(){
            var roles = SessionStorageService.get('USER_ROLES');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();

            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('dataSets').done(function(dss){
                    var dataSets = [];
                    angular.forEach(dss, function(ds){
                        if( CommonUtils.userHasValidRole(ds, 'dataSets', userRoles) ){
                            dataSets.push({id: ds.id, name: ds.name, dataSetType: ds.dataSetType});
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
                        if(ds.organisationUnits.hasOwnProperty( ou.id ) && CommonUtils.userHasValidRole(ds, 'dataSets',userRoles)){
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
                    objs = orderByFilter(objs, '-displayName').reverse();
                    $rootScope.$apply(function(){
                        def.resolve(objs);
                    });
                });
            });
            return def.promise;
        }
    };
})

.factory('ResultsFrameworkFactory', function($http, RfUtils) {

    return {

        get: function(uid){
            var promise = $http.get('../api/resultsFrameworks/' + uid + '.json?fields=id,name,code,description,lastUpdated,active,impacts[id,name,indicators[name]],outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],programms[id,name,code,description,outcomes[id,name,indicators[name]],outputs[id,name,indicators[name]],subProgramms[id,name,code,description,outputs[id,name,indicators[name]]]],attributeValues[value,attribute[id,name,code]]').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        getActive: function(){
            var promise = $http.get('../api/resultsFrameworks.json?filter=active:eq:true&fields=id,name,code,description,lastUpdated,active,impacts[id,name],outcomes[id,name],outputs[id,name],programms[id,name,code,description,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,description,outputs[id,name]]],attributeValues[value,attribute[id,name,code]]&paging=false').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        getAll: function(paging, pager, filter, sortProperty, order){            
            var url = '../api/resultsFrameworks.json?fields=id,name,code,description,lastUpdated,active,impacts[id,name],outcomes[id,name],outputs[id,name],programms[id,name,code,description,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,description,outputs[id,name]]],attributeValues[value,attribute[id,name,code]]';
            url = RfUtils.applyPagingOnUrl( url, paging, pager, filter, sortProperty, order);
            var promise = $http.get( url ).then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
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
})

.factory('ProgramFactory', function($http, RfUtils) {

    return {

        get: function(uid){
            var promise = $http.get('../api/programms/' + uid + '.json?fields=id,name,code,description,lastUpdated,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,lastUpdated,description,sortOrder,outputs[id,name],programm[id]],attributeValues[value,attribute[id,name,code]]').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        getAll: function(paging, pager, filter, sortProperty, order){            
            var url = '../api/programms.json?fields=id,name,code,description,lastUpdated,outcomes[id,name],outputs[id,name],subProgramms[id,name,code,lastUpdated,description,sortOrder,outputs[id,name],programm[id]],attributeValues[value,attribute[id,name,code]]';                       
            url = RfUtils.applyPagingOnUrl( url, paging, pager, filter, sortProperty, order);
            var promise = $http.get( url ).then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        create: function(program){
            var promise = $http.post('../api/programms.json', program).then(function(response){
                return response.data;
            });
            return promise;
        },
        delete: function(program){
            var promise = $http.delete('../api/programms/' + program.id).then(function(response){
                return response.data;
            });
            return promise;
        },
        update: function(program){
            var promise = $http.put('../api/programms/' + program.id, program).then(function(response){
                return response.data;
            });
            return promise;
        }
    };
})

.factory('SubProgramFactory', function($http, RfUtils) {

    return {
        get: function(uid){
            var promise = $http.get('../api/subProgramms/' + uid + '.json?fields=id,name,code,description,lastUpdated,sortOrder,programm[id],outputs[id,name],dataSets[id,name],attributeValues[value,attribute[id,name,code]]').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        getAll: function(){
            var promise = $http.get('../api/subProgramms.json?fields=id,name,code,description,lastUpdated,sortOrder,program[id],outputs[id,name],attributeValues[value,attribute[id,name,code]]&paging=false').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        create: function(subProgram){
            var promise = $http.post('../api/subProgramms.json', subProgram).then(function(response){
                return response.data;
            });
            return promise;
        },
        delete: function(subProgram){
            var promise = $http.delete('../api/subProgramms/' + subProgram.id).then(function(response){
                return response.data;
            });
            return promise;
        },
        update: function(subProgram){
            var promise = $http.put('../api/subProgramms/' + subProgram.id, subProgram).then(function(response){
                return response.data;
            });
            return promise;
        }
    };
})

.factory('ProjectFactory', function($http, RfUtils) {

    return {

        get: function(uid){
            var promise = $http.get('../api/projects/' + uid + '.json?fields=id,name,code,lastUpdated,totalCost,costByGovernment,costByLeadDonor,costByOthers,leadDonor,startDate,endDate,extensionPossible,description,contactName,contactPhone,contactEmail,status,budgetForecastDataSet[id,name],budgetExecutionDataSet[id,name],subProgramms[id,name,code,description],attributeValues[value,attribute[id,name,code]]').then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifier(response);
            });
            return promise;
        },
        getAll: function(paging, pager, filter, sortProperty, order){
            var url = '../api/projects.json?fields=id,name,code,lastUpdated,totalCost,costByGovernment,costByLeadDonor,costByOthers,leadDonor,startDate,endDate,extensionPossible,description,contactName,contactPhone,contactEmail,status,budgetForecastDataSet[id,name],budgetExecutionDataSet[id,name],subProgramms[id,name,code,description, programm[id,name]],attributeValues[value,attribute[id,name,code]]';
                        
            url = RfUtils.applyPagingOnUrl( url, paging, pager, filter, sortProperty, order);
            
            var promise = $http.get( url ).then(function(response){
                return response.data;
            }, function(response){
                RfUtils.errorNotifer(response);
            });
            return promise;
        },
        create: function(project){
            var promise = $http.post('../api/projects.json', project).then(function(response){
                return response.data;
            });
            return promise;
        },
        delete: function(project){
            var promise = $http.delete('../api/projects/' + project.id).then(function(response){
                return response.data;
            });
            return promise;
        },
        update: function(project){
            var promise = $http.put('../api/projects/' + project.id, project).then(function(response){
                return response.data;
            });
            return promise;
        }
    };
})

.factory('MetaAttributesFactory', function($q, $rootScope, orderByFilter, RFStorageService) {

    return {
        getAttributesForObject: function( obj ){
            var def = $q.defer();

            RFStorageService.currentStore.open().done(function(){
                RFStorageService.currentStore.getAll('attributes').done(function(atts){
                    var attributes = [];
                    angular.forEach(atts, function(att){
                        if( att.hasOwnProperty( obj ) && att[obj] ){
                            attributes.push( att );
                        }
                    });

                    attributes = orderByFilter(attributes, '-sortOrder').reverse();

                    $rootScope.$apply(function(){
                        def.resolve(attributes);
                    });
                });
            });
            return def.promise;
        }
    };
})

.service('RfUtils', function($q, $translate, DialogService, ModalService, DateUtils, FileService){

    return {
        removeItems: function(bag, items){
            var result = bag && bag.length && !items ? bag : [];

            if(!bag || !items){
                return result;
            }

            return result;
        },
        errorNotifer: function( response ){
            if( response && response.data && response.data.status === 'ERROR'){
                var dialogOptions = {
                    headerText: response.data.status,
                    bodyText: response.data.message ? response.data.message : $translate.instant('unable_to_fetch_data_from_server')
                };
                DialogService.showDialog({}, dialogOptions);
            }
        },
        processMetaAttributes: function (attributes, attributeValues){
            var atts = [];
            angular.forEach(attributes, function(att){
                if(attributeValues[att.id] || angular.isDefined( attributeValues[att.id] ) ){
                    atts.push({value: attributeValues[att.id], attribute: {id: att.id}});
                }
            });
            return atts;
        },
        processMetaAttributeValues: function(src, des, attributesById){            
            if(!src || !src.attributeValues || !des ){
                return;
            }
            angular.forEach(src.attributeValues, function(av){
                if( av.attribute.id ){                
                    if( attributesById[av.attribute.id] && attributesById[av.attribute.id].valueType === 'DATE'){
                        av.value = DateUtils.formatFromApiToUser( av.value );
                    }               
                    des[av.attribute.id] = av.value;
                }
            });
            return des;            
        },
        getFileNames: function(obj, metaAttributesById){
            var fileNames = [];
            var def = $q.defer();
            angular.forEach(obj.attributeValues, function(av){
                if( metaAttributesById[av.attribute.id] && av.value && metaAttributesById[av.attribute.id].valueType === 'FILE_RESOURCE'){                    
                    FileService.get(av.value).then(function(response){
                        if(response && response.displayName){
                            fileNames[av.attribute.id] = response.displayName;
                        }                        
                        def.resolve(fileNames);
                    });
                }
            });
            def.resolve(fileNames);
            return def.promise;
        },        
        deleteFile: function(id, obj, fileNames){

            if( !id || !obj[id] ){
                var dialogOptions = {
                    headerText: 'error',
                    bodyText: 'missing_file_identifier'
                };
                DialogService.showDialog({}, dialogOptions);
                return;
            }

            var modalOptions = {
                closeButtonText: 'cancel',
                actionButtonText: 'delete',
                headerText: 'delete_attachment',
                bodyText: 'are_you_sure_to_delete_file'
            };
            
            var def = $q.defer();
            ModalService.showModal({}, modalOptions).then(function(){                
                FileService.delete(obj[id]).then(function(){
                    fileNames[id] = null;
                    obj[id] = null;
                    def.resolve({fileName: fileNames, obj: obj});
                });
            });
            
            return def.promise;
        },
        convertToServerDate: function(obj, prop){            
            if(obj[prop]){
                obj[prop] = DateUtils.formatFromUserToApi( obj[prop] );
            }            
            return obj;
        },
        convertToUserDate: function(obj, prop){            
            if(obj[prop]){
                obj[prop] = DateUtils.formatFromApiToUser( obj[prop] );
            }            
            return obj;
        },
        applyPagingOnUrl: function(url, paging, pager, filter, sortProperty, order){            
            if( paging ){
                var pgSize = pager.pageSize ? pager.pageSize : 50;
                var pg = pager.page ? pager.page : 1;
                pgSize = pgSize > 1 ? pgSize  : 1;
                pg = pg > 1 ? pg : 1; 
                url = url  + '&pageSize=' + pgSize + '&page=' + pg;
            }
            else{
                url = url  + '&paging=false';
            }
            
            if( filter && filter !== ""){
                url = url + '&filter=name:like:' + filter;
            }
            
            var sortingParam = '&order='+sortProperty;
            sortingParam += order ? ':asc' : ':desc';
            
            return url + sortingParam;            
        }
    };
})

.service('DataValueService', function($http){
    return {
        save: function(dv){
            var promise = $http.post('../api/dataValues.json?de='+dv.de+'&ou='+dv.ou+'&pe='+dv.pe+'&value='+dv.value);
            return promise;
        },
        get: function(dv){
            var promise = $http.get('../api/dataValues.json?de='+dv.de+'&ou='+dv.ou+'&pe='+dv.pe);
            return promise;
        },
        saveDataValueSet: function(dvs){
            var promise = $http.post('../api/dataValueSets.json', dvs).then(function(response){
                return response.data;
            });
            return promise;
        },
        getDataValueSet: function(params){
            var promise = $http.get('../api/dataValueSets.json?'+params).then(function(response){                
                var dvsByPe = [];
                if( response.data.dataValues ){
                    angular.forEach(response.data.dataValues, function(dv){
                        dvsByPe[dv.period] = dv;
                    });
                }
                return dvsByPe;
            });
            return promise;
        }
    };
});