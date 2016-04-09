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
                RfUtils) {

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
                        metaAttributesById: [],
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
                $scope.model.metaAttributesById[att.id] = att;
            });

            DataSetFactory.getAll().then(function(dss){
                //$scope.model.budgetExecutionDataSets = $filter('filter')(dss, {dataSetType: "BUDGETEXECUTION"});
                //$scope.model.budgetForecastDataSets = $filter('filter')(dss, {dataSetType: "BUDGETFORECAST"});

                ProjectFactory.getAll().then(function(response){
                    $scope.model.projects = response.projects ? response.projects : [];
                    
                    var assignForecastDataSets = [], assignedExecutionDataSets = [];
                    angular.forEach($scope.model.projects, function(pr){
                        if( pr.budgetForecastDataSet ){
                            assignForecastDataSets.push( pr.budgetForecastDataSet.id);
                        }
                        if( pr.budgetExecutionDataSet ){
                            assignedExecutionDataSets.push( pr.budgetExecutionDataSet.id);
                        }
                    });

                    angular.forEach(dss, function(ds){
                        if( assignForecastDataSets.indexOf(ds.id) === -1 && assignedExecutionDataSets.indexOf(ds.id) === -1 ){
                            if( ds.dataSetType === 'BUDGETEXECUTION'){
                                $scope.model.budgetExecutionDataSets.push( ds );
                            }
                            else if( ds.dataSetType === 'BUDGETFORECAST'){
                                $scope.model.budgetForecastDataSets.push( ds );
                            }
                        }
                    });
                });
            });
        });
    });

    $scope.showAddProject = function(){
        $scope.model.showAddProjectDiv = !$scope.model.showAddProjectDiv;
        $scope.model.metaAttributeValues = {};
    };

    $scope.showEditProject = function(){
        $scope.model.metaAttributeValues = {};
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();
        
        $scope.model.selectedProject = RfUtils.convertToUserDate($scope.model.selectedProject, 'startDate');
        $scope.model.selectedProject = RfUtils.convertToUserDate($scope.model.selectedProject, 'endDate');
        
        $scope.model.metaAttributeValues = RfUtils.processMetaAttributeValues($scope.model.selectedProject, $scope.model.metaAttributeValues, $scope.model.metaAttributesById);
                
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = true;
    };

    $scope.showBudgetForecast = function(){
        
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();
        
        if( $scope.model.selectedProject.budgetForecastDataSet && $scope.model.selectedProject.budgetForecastDataSet.id ){
            
            MetaDataFactory.get('dataSets', $scope.model.selectedProject.budgetForecastDataSet.id).then(function(ds){

                if( !ds.dataElements || ds.dataElements.length !== 1 ) {
                    var dialogOptions = {
                        headerText: 'error',
                        bodyText: $translate.instant('buget_forecast_dataelement_error')
                    };
                    DialogService.showDialog({}, dialogOptions);
                    return;
                } 

                if( !ds.organisationUnits || Object.keys(ds.organisationUnits).length !== 1 ) {
                    var dialogOptions = {
                        headerText: 'error',
                        bodyText: $translate.instant('budget_forecast_orgunit_error')
                    };
                    DialogService.showDialog({}, dialogOptions);
                    return;
                }

                var modalInstance = $modal.open({
                    templateUrl: 'components/project/project-budget-forecast.html',
                    controller: 'ProjectBudgetForecastController',
                    resolve: {
                        selectedProject: function() {
                            return $scope.model.selectedProject;
                        },
                        budgetForecastDataSet: function(){
                            return ds;
                        }
                    }
                });        

                modalInstance.result.then(function(){            
                });
            });
        }
        else{
            var dialogOptions = {
                headerText: 'error',
                bodyText: $translate.instant('budget_forecast_data_set_missing')
            };
            DialogService.showDialog({}, dialogOptions);
            return;
        }        
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
                
        $scope.model.selectedProject = RfUtils.convertToServerDate($scope.model.selectedProject, 'startDate');
        $scope.model.selectedProject = RfUtils.convertToServerDate($scope.model.selectedProject, 'endDate');
        
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
                pr.id = $scope.model.selectedProject.id = data.response.lastImported;
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

        $scope.model.selectedProject = RfUtils.convertToServerDate($scope.model.selectedProject, 'startDate');
        $scope.model.selectedProject = RfUtils.convertToServerDate($scope.model.selectedProject, 'endDate');
        
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