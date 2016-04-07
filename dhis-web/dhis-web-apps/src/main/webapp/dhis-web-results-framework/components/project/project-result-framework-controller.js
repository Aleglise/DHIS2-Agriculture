/* global resultsFramework */

//Controller for the header section
resultsFramework.controller('ProjectResultFrameworkController',
        function($scope,
                $modalInstance,
                ResultsFrameworkFactory,
                ProjectFactory,
                DialogService,
                selectedProject) {   
    
    $scope.selectedProject = selectedProject;
    $scope.model = {selectedSubPrograms: {}};
    
    angular.forEach($scope.selectedProject.subProgramms, function(sp){
        $scope.model.selectedSubPrograms[sp.id] = true;
    });
    
    ResultsFrameworkFactory.getActive().then(function(response){
        $scope.model.activeResultsFramework = response.resultsFrameworks[0];
    });
    
    $scope.save = function(){
        
        $scope.selectedProject.subProgramms = [];
        for (var k in $scope.model.selectedSubPrograms) {
            if ($scope.model.selectedSubPrograms.hasOwnProperty(k) && $scope.model.selectedSubPrograms[k]) {
               $scope.selectedProject.subProgramms.push({id: k});
            }
        }
        
        ProjectFactory.update($scope.selectedProject).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'project_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            $scope.close();
        });
    };
    
    $scope.close = function(){
        $modalInstance.close();
    };
});