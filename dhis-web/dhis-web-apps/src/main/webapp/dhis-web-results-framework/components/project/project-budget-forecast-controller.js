resultsFramework.controller('ProjectBudgetForecastController',
							function ($scope,
									  $modalInstance,
									  $q,
									  ResultsFrameworkFactory,
									  ProjectFactory,
									  DialogService,
									  dataValuesService,
									  selectedProject,
									  DateUtils) {

	$scope.selectedProject = selectedProject;
	$scope.selectedProject.budgetForecastData = [];
	
	$scope.selectedProject.startYear = DateUtils.splitDate($scope.selectedProject.startDate).year;
	$scope.selectedProject.endYear = DateUtils.splitDate($scope.selectedProject.endDate).year;

	/* calculating years between projects' start year and end year */
	for (var i = 0; i+$scope.selectedProject.startYear <= $scope.selectedProject.endYear; i++) {
		$scope.selectedProject.budgetForecastData[i] = {year: $scope.selectedProject.startYear + i};
	}

	$scope.save = function () {

		$scope.promises = [];
		
		angular.forEach($scope.selectedProject.budgetForecastData,function(val, key){
			var dataValue = {};
			dataValue.de = $scope.selectedProject.budgetForecastDataSet.dataElements[0].id;
			dataValue.ou = Object.getOwnPropertyNames($scope.selectedProject.budgetForecastDataSet.organisationUnits)[0];
			dataValue.pe = $scope.selectedProject.budgetForecastData[key].year;
			dataValue.value = $scope.selectedProject.budgetForecastData[key].cost;

			$scope.promises.push(dataValuesService.save(dataValue));	
		});

		$q.all($scope.promises).then(function(response) {
			if (response.status === 'ERROR') {
				var dialogOptions = {
					headerText: 'project_saving_error',
					bodyText: data.message
				};
				DialogService.showDialog({}, dialogOptions);
			}
			$modalInstance.close();
		});		
	};

	$scope.close = function () {
		$modalInstance.close();
	};
    });