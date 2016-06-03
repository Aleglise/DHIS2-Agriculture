/* global angular */

'use strict';

/* Controllers */
var performanceContractControllers = angular.module('performanceContractControllers', [])

//Controller for settings page
.controller('PerformanceContractController',
        function($scope,
                SessionStorageService,
                DialogService,
                DataSetFactory,
                PeriodService,
                AnalyticsService,
                MetaDataFactory,
                GridService) {
                    
    $scope.periodOffset = 0;
    $scope.model = {invalidDimensions: false};
    
    //watch for selection of org unit from tree
    $scope.$watch('selectedOrgUnit', function() {
        $scope.model = {invalidDimensions: false};
        if( angular.isObject($scope.selectedOrgUnit)){            
            SessionStorageService.set('SELECTED_OU', $scope.selectedOrgUnit);            
            $scope.loadDataSets($scope.selectedOrgUnit);
        }
    });   
    
    //load datasets associated with the selected org unit.
    $scope.loadDataSets = function(orgUnit) {
        $scope.selectedOrgUnit = orgUnit;        
        if (angular.isObject($scope.selectedOrgUnit)) {            
            DataSetFactory.getBaselineDataSetsByOu($scope.selectedOrgUnit, $scope.selectedDataSet).then(function(response){
                $scope.model.dataSets = response.dataSets;
                $scope.model.selectedDataSet = response.selectedDataSet;
            });
        }        
    }; 
    
    //watch for selection of org unit from tree
    $scope.$watch('model.selectedDataSet', function() {
        $scope.model.dimensionUrl = null;
        $scope.model.optionUrl = null;
        $scope.model.baselineOption = null;
        $scope.model.report = null;
        $scope.model.periods = [];
        $scope.model.invalidDimensions = false;
        if( angular.isObject($scope.model.selectedDataSet) && $scope.model.selectedDataSet.id){
            $scope.loadDataSetDetails();
        }
    });
    
    $scope.$watch('model.selectedPeriod', function(){
        $scope.generateAnalyticsPeriods();
    });
    
    $scope.generateAnalyticsPeriods = function(){        
        $scope.model.periodUrl = null;
        $scope.model.analyticsPeriods = [];
        if( angular.isObject( $scope.model.selectedPeriod) && $scope.model.selectedPeriod.id){        
            $scope.model.periodUrl = 'dimension=pe:';
            var invalidPeriod = false;
            switch( $scope.model.selectedDataSet.periodType ){
                case 'Monthly':
                    for(var i=1; i< 13; i++){
                        $scope.model.periodUrl +=  $scope.model.selectedPeriod.name + ("0" + i).slice(-2) + ';';
                        $scope.model.analyticsPeriods.push( {id: $scope.model.selectedPeriod.name + ("0" + i).slice(-2), name:  ("0" + i).slice(-2)} );
                    }
                    break
                case 'Quarterly':
                    for(var i=1; i< 5; i++){
                        $scope.model.periodUrl +=  $scope.model.selectedPeriod.name + 'Q'+ i + ';';
                        $scope.model.analyticsPeriods.push( {id: $scope.model.selectedPeriod.name + 'Q'+ i, name: 'Q'+ i} );
                    }
                    break
                case 'SixMonthly':
                    for(var i=1; i< 3; i++){
                        $scope.model.periodUrl +=  $scope.model.selectedPeriod.name + 'S'+ i + ';';
                        $scope.model.analyticsPeriods.push( {id: $scope.model.selectedPeriod.name + 'S'+ i, name:  'S'+ i} );
                    }
                    break
                case 'Yearly':
                    $scope.periodUrl +=  $scope.model.selectedPeriod.name + ';';
                    $scope.model.analyticsPeriods.push( {id: $scope.model.selectedPeriod.name, name:  $scope.model.selectedPeriod.name} );
                    break
                default:
                    invalidPeriod = true;
                    $scope.invalidCategoryDimensionConfiguration('error', 'invalid_period_performance_contract');
                    return;    
            }

            if( !invalidPeriod ){
                $scope.model.periodUrl = $scope.model.periodUrl.slice(0,-1);

                AnalyticsService.fetchData( $scope.model.periodUrl + '&' + $scope.model.dimensionUrl, $scope.model.stakeholderUrl, $scope.model.baselineOption, $scope.model.progressOption, $scope.model.targetOption ).then(function(response){
                    $scope.model.report = response.report;
                    $scope.model.templateLayout = GridService.generateColumns();                
                });
            }
        }
    };
    
    $scope.loadDataSetDetails = function(){
        if( $scope.model.selectedDataSet && $scope.model.selectedDataSet.id && $scope.model.selectedDataSet.periodType){ 
            
            if( $scope.model.selectedDataSet.periodType === 'Daily' ||
                $scope.model.selectedDataSet.periodType === 'Weekly' ||   
                $scope.model.selectedDataSet.periodType === 'SixMonthlyApril' ||
                $scope.model.selectedDataSet.periodType === 'FinancialJuly' || 
                $scope.model.selectedDataSet.periodType === 'FinancialApril' || 
                $scope.model.selectedDataSet.periodType === 'FinancialOct' ){
                
                $scope.invalidCategoryDimensionConfiguration('error', 'invalid_period_performance_contract');
                return;
            }
            
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.model.periodOffset);
            
            if(!$scope.model.selectedDataSet.dataElements || $scope.model.selectedDataSet.dataElements.length < 1){                
                $scope.invalidCategoryDimensionConfiguration('error', 'missing_data_elements_indicators');
                return;
            }            
            
            $scope.model.stakeholderList = null;            
            MetaDataFactory.get('categoryCombos', $scope.model.selectedDataSet.categoryCombo.id).then(function(coc){
                $scope.model.stakeholderList = coc;
            });
            
            $scope.model.selectedCategoryCombo = null;
            var selectedDataElementGroupSetId = null;            
            $scope.model.dimensionUrl = 'dimension=dx:';
            
            angular.forEach($scope.model.selectedDataSet.dataElements, function(de){
                if(!$scope.model.selectedCategoryCombo && de.categoryCombo && !de.categoryCombo.isDefault){
                    $scope.model.selectedCategoryCombo = de.categoryCombo;
                }
                                
                if(!selectedDataElementGroupSetId && de.dataElementGroups && de.dataElementGroups[0] && de.dataElementGroups[0].dataElementGroupSet){
                    selectedDataElementGroupSetId = de.dataElementGroups[0].dataElementGroupSet.id;
                }
                
                $scope.model.dimensionUrl +=  de.id + ';';
            });
            
            if( $scope.model.selectedCategoryCombo ){
                if( $scope.model.selectedCategoryCombo.categories && 
                        $scope.model.selectedCategoryCombo.categories.length === 1 &&
                        $scope.model.selectedCategoryCombo.categories[0].dimension &&
                        $scope.model.selectedCategoryCombo.categories[0].categoryOptions){
                
                    $scope.model.optionUrl = 'dimension=' + $scope.model.selectedCategoryCombo.categories[0].id + ':';
                    angular.forEach($scope.model.selectedCategoryCombo.categories[0].categoryOptions, function(op){                        
                        
                        $scope.model.optionUrl +=  op.id + ';';
                        
                        if( op.name === 'Baseline' ){
                            $scope.model.baselineOption = op;
                        }
                        else if( op.name === 'Target' ){
                            $scope.model.targetOption = op;
                        }
                        else if( op.name === 'Progress' ){
                            $scope.model.progressOption = op;
                        }
                        /*if( op.attributeValues && op.attributeValues.length > 0){
                            for(var i=0; i<op.attributeValues.length && !$scope.model.baselineOption; i++){
                                if( op.attributeValues[i].value && op.attributeValues[i].attribute.code === 'baseline'){
                                    $scope.model.baselineOption = op;
                                }
                            }
                        }*/
                    });                    
                }
                else{
                    $scope.invalidCategoryDimensionConfiguration('error', 'data_set_have_invalid_dimension');
                    return;
                }
            }
            else{
                $scope.invalidCategoryDimensionConfiguration('error', 'data_set_have_invalid_dimension');
                return;
            }
            
            if( $scope.model.dimensionUrl ){
                
                $scope.model.dimensionUrl = $scope.model.dimensionUrl.slice(0,-1);
                
                if( $scope.model.optionUrl ){
                    $scope.model.optionUrl = $scope.model.optionUrl.slice(0,-1);                
                    $scope.model.dimensionUrl += '&' + $scope.model.optionUrl;
                    $scope.model.dimensionUrl += '&filter=ou:' + $scope.selectedOrgUnit.id + '&skipMeta=true';
                }
            }
        }
    };
    
    $scope.manageStakeholder = function(category, option){        
        $scope.model.stakeholderUrl = null;
        if( option && option.id && category && category.id ){
            $scope.model.stakeholderUrl = '&filter='+ category.id + ':' + option.id;
        }
        
        $scope.generateAnalyticsPeriods();
    };
    
    $scope.invalidCategoryDimensionConfiguration = function( headerText, bodyText){
        $scope.model.invalidDimensions = true;
        var dialogOptions = {
            headerText: headerText,
            bodyText: bodyText
        };
        DialogService.showDialog({}, dialogOptions);
    };
    
    $scope.getPeriods = function(mode){
        
        if( mode === 'NXT'){
            $scope.periodOffset = $scope.periodOffset + 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.periodOffset);
        }
        else{
            $scope.periodOffset = $scope.periodOffset - 1;
            $scope.model.selectedPeriod = null;
            $scope.model.periods = PeriodService.getPeriods('Yearly', $scope.periodOffset);
        }
    };
    
    $scope.getSum = function(op1, op2){        
        op1 = dhis2.validation.isNumber(op1) ? parseInt(op1) : 0;
        op2 = dhis2.validation.isNumber(op2) ? parseInt(op2) : 0;        
        return op1 + op2;
    };
    
    $scope.getPercent = function(op1, op2){        
        op1 = dhis2.validation.isNumber(op1) ? parseInt(op1) : 0;
        op2 = dhis2.validation.isNumber(op2) ? parseInt(op2) : 0;        
        if( op2 === 0 ){
            return 0;
        }        
        return parseFloat((op1 / op2)*100).toFixed(2) + '%';
    };    
});
