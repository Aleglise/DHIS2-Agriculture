/* global angular */

'use strict';

/* Controllers */
var resultsFrameworkControllers = angular.module('resultsFrameworkControllers', [])

//Controller for settings page
.controller('PerformanceContractController',
        function($scope,
                SessionStorageService,
                MetaDataFactory,
                DialogService,
                DataSetFactory,
                PeriodService,
                GridService) {
                    
    $scope.maxOptionSize = 30;
    $scope.periodOffset = 0;
    $scope.model = {};    
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model = {};
        if( angular.isObject($scope.selectedOrgUnit)){            
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit);            
            $scope.loadDataSets($scope.selectedOrgUnit);
        }
    });   
    
    //load datasets associated with the selected org unit.
    $scope.loadDataSets = function(orgUnit) {
        $scope.selectedOrgUnit = orgUnit;
        
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getDataSetsByOu($scope.selectedOrgUnit, $scope.selectedDataSet).then(function(response){
                $scope.model.dataSets = response.dataSets;
                $scope.model.selectedDataSet = response.selectedDataSet;
            });
        }        
    }; 
    
    //watch for selection of org unit from tree
    $scope.$watch('model.selectedDataSet', function() {
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    }); 
    
    $scope.loadDataSetDetails = function(){
        if( $scope.model.selectedDataSet && $scope.model.selectedDataSet.id && $scope.model.selectedDataSet.periodType){            
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.model.periodOffset);
            
            if(!$scope.model.selectedDataSet.dataElements || $scope.model.selectedDataSet.dataElements.length < 1){
                var dialogOptions = {
                    headerText: 'error',
                    bodyText: 'missing_data_elements_indicators'
                };

                DialogService.showDialog({}, dialogOptions);
                return;
            }  
            
            var selectedCategoryComboId = null;
            var selectedDataElementGroupSetId = null;
            $scope.model.data = [];
            for(var i=0; i<$scope.model.selectedDataSet.dataElements.length; i++){
                if(!selectedCategoryComboId && $scope.model.selectedDataSet.dataElements[i].categoryCombo && !$scope.model.selectedDataSet.dataElements[i].categoryCombo.isDefault){
                    selectedCategoryComboId = $scope.model.selectedDataSet.dataElements[i].categoryCombo.id;
                }
                                
                if(!selectedDataElementGroupSetId && $scope.model.selectedDataSet.dataElements[i].dataElementGroups && $scope.model.selectedDataSet.dataElements[i].dataElementGroups[0] && $scope.model.selectedDataSet.dataElements[i].dataElementGroups[0].dataElementGroupSet){
                    selectedDataElementGroupSetId = $scope.model.selectedDataSet.dataElements[i].dataElementGroups[0].dataElementGroupSet.id;
                }
                
                $scope.model.data.push(angular.extend({},$scope.model.selectedDataSet.dataElements[i], {type: {label: 'target'}}));
                $scope.model.data.push(angular.extend({},$scope.model.selectedDataSet.dataElements[i], {type: {label: 'progress'}}));
            }
                        
            if(selectedDataElementGroupSetId && selectedCategoryComboId) {
                MetaDataFactory.get('dataElementGroupSets', selectedDataElementGroupSetId).then(function(gs){
                    $scope.model.selectedDataElementGroupSet = gs;                    
                    if( $scope.model.selectedDataElementGroupSet && $scope.model.selectedDataElementGroupSet.id){
                        var templateRows = [{id: 'groupSetParentId', name: 'GROUP SET PARENT'}, {id: $scope.model.selectedDataElementGroupSet.id, name: $scope.model.selectedDataElementGroupSet.name}];
                        MetaDataFactory.get('categoryCombos', selectedCategoryComboId).then(function(cc){
                            $scope.model.selectedCategoryCombo = cc;
                            $scope.model.templateLayout = GridService.generateLayout(templateRows);
                        });
                    }                    
                });
            }
            
        }
    };
    
    $scope.getPeriods = function(mode){
        
        if( mode === 'NXT'){
            $scope.periodOffset = $scope.periodOffset + 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.periodOffset);
        }
        else{
            $scope.periodOffset = $scope.periodOffset - 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods($scope.model.selectedDataSet.periodType, $scope.periodOffset);
        }
    };
});
