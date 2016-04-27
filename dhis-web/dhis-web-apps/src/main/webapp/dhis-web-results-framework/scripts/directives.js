/* global directive, selection, dhis2, angular */

'use strict';

/* Directives */

var resultsFrameworkDirectives = angular.module('resultsFrameworkDirectives', [])

.directive('d2MultiSelect', function ($q) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            selectedLabel: "@",
            availableLabel: "@",
            displayAttr: "@",
            available: "=",
            model: "=ngModel"
        },
        template: '<div class="row">' + 
                    '<div class="col-sm-12 vertical-spacing"> ' +
                        '<input class="form-control" placeholder="{{\'your_filter_text\' | translate}}" ng-model="filterText"/>'+
                    '</div>' +
                  '</div>' +
                  '<div class="row">'+
                    '<div class="col-sm-5">' + 
                        '<div class="select-list-labels">{{ availableLabel }}</div>' +
                        '<div><select id="multiSelectAvailable" ng-model="selected.available" multiple ng-options="e as e[displayAttr] for e in available | filter:filterText | orderBy: \'name\'"></select></div>' + 
                    '</div>' + 
                    '<div class="col-sm-2">' + 
                      '<div class="select-list-buttons"><button class="btn btn-default btn-block" ng-click="add()" ng-disabled="selected.available.length == 0">' + 
                        '{{\'select\' | translate}}' + 
                      '</div></button>' + 
                      '<div class="vertical-spacing"><button class="btn btn-default btn-block" ng-click="remove()" ng-disabled="selected.current.length == 0">' + 
                        '{{\'remove\' | translate}}' + 
                      '</div></button>' +
                    '</div>' + 
                    '<div class="col-sm-5">' +
                        '<div class="select-list-labels">{{ selectedLabel }}</div>' +
                        '<div><select id="multiSelectSelected" ng-model="selected.current" multiple ng-options="e as e[displayAttr] for e in model | orderBy: \'name\'"></select></div>' +
                    '</div>' +
                  '</div>',
        link: function (scope, elm, attrs) {
            scope.selected = {
                available: [],
                current: []
            };

            // Handles cases where scope data hasn't been initialized yet
            var dataLoading = function (scopeAttr) {
                var loading = $q.defer();
                if (scope[scopeAttr]) {
                    loading.resolve(scope[scopeAttr]);
                } else {
                    scope.$watch(scopeAttr, function (newValue, oldValue) {
                        if (newValue !== undefined)
                            loading.resolve(newValue);
                    });
                }
                return loading.promise;
            };

            // Filters out items in original that are also in toFilter. Compares by reference. 
            var filterOut = function (original, toFilter) {
                var filtered = [];
                angular.forEach(original, function (entity) {
                    var match = false;
                    for (var i = 0; i < toFilter.length; i++) {
                        if (toFilter[i][attrs.displayAttr] === entity[attrs.displayAttr]) {
                            match = true;
                            break;
                        }
                    }
                    if (!match) {
                        filtered.push(entity);
                    }
                });
                return filtered;
            };

            scope.refreshAvailable = function () {
                scope.available = filterOut(scope.available, scope.model);
                scope.selected.available = [];
                scope.selected.current = [];
            };

            scope.add = function () {
                scope.model = scope.model.concat(scope.selected.available);
                scope.refreshAvailable();
            };
            scope.remove = function () {
                scope.available = scope.available.concat(scope.selected.current);
                scope.model = filterOut(scope.model, scope.selected.current);
                scope.refreshAvailable();
            };

            $q.all([dataLoading("model"), dataLoading("available")]).then(function (results) {
                scope.refreshAvailable();
            });
        }
    };
})

.directive('metaDataCached', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            
            $(document).on("metaDataCached", listenerFunction);

            //listen to metaDataCached, and inform angular 
            function listenerFunction(e) {
                $timeout(function () {
                    scope.model.metaDataCached = e.message;
                    scope.$apply();
                });
            }
        }
    };
})

.directive('d3FileUpload', function(FileService, DialogService){
    
    return {
        restrict: "A",
        scope: {
            d3FileUpload: '=',
            d3FileNames: '='
        },
        link: function (scope, element, attrs) {
            var attributeId = attrs.inputFieldId;            
            var updateModel = function () {
                FileService.upload(element[0].files[0], true).then(function(data){                    
                    if(data && data.status === 'OK' && 
                            data.response && 
                            data.response.fileResource && 
                            data.response.fileResource.id && 
                            data.response.fileResource.name){                                            
                        scope.d3FileUpload[attributeId] = data.response.fileResource.id;   
                        scope.d3FileNames[attributeId] = data.response.fileResource.name;                        
                    }
                    else{
                        var dialogOptions = {
                            headerText: 'error',
                            bodyText: 'file_upload_failed'
                        };		
                        DialogService.showDialog({}, dialogOptions);
                    }                    
                });                 
            };             
            element.bind('change', updateModel);            
        }
    };    
})

.directive('d3FileDownload', function($parse, $window, DialogService){
    
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var valueGetter = $parse(attrs.d3FileDownload);
            element.click(function() {
                if( !valueGetter(scope) ){            
                    var dialogOptions = {
                        headerText: 'error',
                        bodyText: 'missing_file_identifier'
                    };
                    DialogService.showDialog({}, dialogOptions);
                    return;
                }
                $window.open('../api/fileResources/' + valueGetter(scope) + '/data', '_blank', '');                
            });
        }
    };
});  