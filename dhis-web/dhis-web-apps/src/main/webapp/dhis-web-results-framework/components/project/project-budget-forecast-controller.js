/* global resultsFramework */

resultsFramework.controller('ProjectBudgetForecastController',
                function ($scope,
                        $modalInstance,
                        $q,
                        $translate,
                        DialogService,
                        DataValueService,
                        selectedProject,
                        budgetForecastDataSet,
                        DateUtils) {
	$scope.selectedProject = selectedProject;
        $scope.budgetForecastDataSet = budgetForecastDataSet;
	$scope.budgetForecastData = [];
        var dataValueSetUrl = "dataSet=" + $scope.budgetForecastDataSet.id + "&orgUnit=" + Object.getOwnPropertyNames($scope.budgetForecastDataSet.organisationUnits)[0];
	
	$scope.selectedProject.startYear = DateUtils.splitDate($scope.selectedProject.startDate).year;
	$scope.selectedProject.endYear = DateUtils.splitDate($scope.selectedProject.endDate).year;
        
	/* calculating years between projects' start year and end year */        
	for (var i = 0; i+$scope.selectedProject.startYear <= $scope.selectedProject.endYear; i++) {
            $scope.budgetForecastData[i] = {period: $scope.selectedProject.startYear + i, 
                                            dataElement: $scope.budgetForecastDataSet.dataElements[0].id,
                                            orgUnit: Object.getOwnPropertyNames($scope.budgetForecastDataSet.organisationUnits)[0]
                                        };
            dataValueSetUrl += "&period=" + $scope.budgetForecastData[i].period;
	}
        
        //fetch if forecast data is available
        DataValueService.getDataValueSet(dataValueSetUrl).then(function(dvs){
            angular.forEach($scope.budgetForecastData,function(bfd){
                var dv = dvs[bfd.period];
                if( dv && dv.dataElement === bfd.dataElement && dv.orgUnit === bfd.orgUnit){
                    bfd.value = parseInt( dv.value );
                }
            });
        });            
            
	$scope.save = function () {
            
            //check for form validity
            $scope.budgetForecastForm.submitted = true;
            if( $scope.budgetForecastForm.$invalid ){
                return false;
            }
            
            var dataValueSet = {dataValues: []};
            angular.forEach($scope.budgetForecastData,function(bfd){
                    var dataValue = {};
                    dataValue.dataElement = bfd.dataElement;
                    dataValue.orgUnit = bfd.orgUnit;
                    dataValue.period = bfd.period;
                    dataValue.value = bfd.value;
                    dataValueSet.dataValues.push( dataValue );
            });
            
            DataValueService.saveDataValueSet(dataValueSet).then(function(response){
                if( response.conflicts) {
                    var dialogOptions = {
                        headerText: 'budget_forecast_save_error',
                        bodyText: response.conflicts[0].value
                    };
                    DialogService.showDialog({}, dialogOptions);
                    return;
                }
                else{
                    var dialogOptions = {
                        headerText: 'success',
                        bodyText: $translate.instant('budget_forecast_save_success')
                    };
                    DialogService.showDialog({}, dialogOptions);
                    $scope.close();
                }
            });
	};

	$scope.close = function () {
            $modalInstance.close();
	};
        
        $scope.interacted = function(field, form) {
            var status = false;
            if(!form){
                return status;
            }
            if(field){
                status = form['submitted'] || field.$dirty;
            }
            return status;
        };
    });