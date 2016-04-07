/* global resultsFramework */

//Controller for the header section
resultsFramework.controller('ProjectController', 
        function($scope,
                $filter,
                $translate,
                $modal,
                DialogService, 
                ModalService, 
                ProjectFactory, 
                MetaDataFactory,
                DataSetFactory,
                MetaAttributesFactory,
                ContextMenuSelectedItem,
                RfUtils,
                DateUtils) {
    
    $scope.fileNames = [];
    $scope.maxOptionSize = 30;
    $scope.model = {    showAddProjectDiv: false,
                        showEditProject: false,
                        selectSize: 20,
                        projects: [],
                        donorList: [],
                        selectedProject: {},
                        budgetExecutionDataSets: [],
                        budgetForecastDataSets: [],
                        indicatorGroups: [],
                        metaAttributes: [],
                        metaAttributeValues: {}
                    };

    $scope.projectForm = {submitted: false};
    
    MetaDataFactory.getAll('indicatorGroups').then(function(idgs){
        $scope.model.impactIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "IMPACT"});
        $scope.model.outcomeIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTCOME"});
        $scope.model.outputIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTPUT"});
        
        MetaAttributesFactory.getAttributesForObject( 'projectAttribute' ).then(function(attributes){
            angular.forEach(attributes, function(att){
                if(att.code === 'donorList' && att.optionSet && att.optionSet.options && att.optionSet.options.length > 0){
                    $scope.model.donorList = att.optionSet.options;
                }
                else{
                    $scope.model.metaAttributes.push( att );
                }
            });
            
            DataSetFactory.getAll().then(function(dss){
                $scope.model.budgetExecutionDataSets = $filter('filter')(dss, {dataSetType: "BUDGETEXECUTION"});
                $scope.model.budgetForecastDataSets = $filter('filter')(dss, {dataSetType: "BUDGETFORECAST"});
                
                ProjectFactory.getAll().then(function(response){
                    $scope.model.projects = response.projects ? response.projects : [];
                });                
            });            
        });
    });
    
    $scope.showAddProject = function(){
        $scope.model.showAddProjectDiv = !$scope.model.showAddProjectDiv;
    };
    
    $scope.showEditProject = function(){
        $scope.model.metaAttributeValues = {};
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();        
        angular.forEach($scope.model.selectedProject.attributeValues, function(av){
            $scope.model.metaAttributeValues[av.attribute.id] = av.value;
        });        
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = true;
    };
    
    $scope.showBudgetForecast = function(){
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();        
        if(!$scope.model.selectedProject.budgetForecastDataSet) {
            var dialogOptions = {
                headerText: 'error',
                bodyText: $translate.instant('budget_forecast_data_set_missing')
            };

            DialogService.showDialog({}, dialogOptions);
            
            return;
        }
        
        $scope.model.forecastYears = DateUtils.getCeilYears($scope.model.selectedProject.startDate,$scope.model.selectedProject.endDate);
        $scope.model.forecastStartYear = DateUtils.splitDate($scope.model.selectedProject.startDate);
        
        var dialogOptions = {
            headerText: 'Budget Forecast',
            bodyText: 'dialog for entering buget breakdown for ' + $scope.model.forecastYears + ' years is coming...'
        };

        DialogService.showDialog({}, dialogOptions);
    };
    
    $scope.setSelectedProject = function(project){
        $scope.model.selectedProject = project;
        ContextMenuSelectedItem.setSelectedItem($scope.model.selectedProject);
    };
    
    $scope.hideAddProject = function(){
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = false;
        $scope.model.selectedProject = {};
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
    
    $scope.addProject = function(){
        
        //check for form validity
        $scope.projectForm.submitted = true;        
        if( $scope.projectForm.$invalid ){            
            return false;
        }
        
        $scope.model.selectedProject.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        
        //form is valid, continue with adding
        ProjectFactory.create($scope.model.selectedProject).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'project_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            else {
                
                //add the new project to the grid
                var pr = angular.copy($scope.model.selectedProject);
                pr.id = data.lastImported;                
                $scope.model.projects.splice(0,0,pr);
                    
                //reset form              
                $scope.cancel();
            }
        });
    };
    
    $scope.updateProject = function(){

        //check for form validity
        $scope.projectForm.submitted = true;        
        if( $scope.projectForm.$invalid ){
            return false;
        }
        
        $scope.model.selectedProject.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        
        //form is valid, continue with adding
        ProjectFactory.update($scope.model.selectedProject).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'project_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            
            for(var i=0; i<$scope.model.projects.length; i++){
                if( $scope.model.selectedProject.id === $scope.model.projects[i].id){
                    $scope.model.projects[i] = $scope.model.selectedProject;
                    break;
                }
            }
            
            //reset form              
            $scope.cancel();
        });
    };
    
    $scope.deleteProject = function(){
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'delete',
            headerText: 'delete',
            bodyText: 'are_you_sure_to_delete'
        };

        ModalService.showModal({}, modalOptions).then(function(){            
            ProjectFactory.delete($scope.model.selectedProject).then(function(){                
                for(var i=0; i<$scope.model.projects.length; i++){
                    if( $scope.model.selectedProject.id === $scope.model.projects[i].id){
                        $scope.model.projects.splice(i,1);    
                        break;
                    }
                }
                
                $scope.cancel();
                
            }, function(){
                var dialogOptions = {
                    headerText: 'error',
                    bodyText: 'delete_error'
                };
                DialogService.showDialog({}, dialogOptions);
            });
        });
    };
    
    $scope.contributionToResultFramework = function(){        
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();        
        var modalInstance = $modal.open({
            templateUrl: 'components/project/project-result-framework.html',
            controller: 'ProjectResultFrameworkController',
            resolve: {
                selectedProject: function () {
                    return $scope.model.selectedProject;
                }
            }
        });

        modalInstance.result.then(function (program) {
            if (angular.isObject(program)) {
                $scope.model.selectedProgram = program;
            }
        }, function () {
        });
    };
    
    $scope.cancel = function(){
        $scope.projectForm.submitted = false;
        $scope.hideAddProject();
    };
});