/* global resultsFramework */

//Controller for the header section
resultsFramework.controller('ProjectController',
        function($scope,
                $rootScope,
                $filter,
                $translate,
                $modal,
                orderByFilter,
                DialogService,
                ModalService,
                ProjectFactory,
                MetaDataFactory,
                DataSetFactory,
                ResultsFrameworkFactory,
                MetaAttributesFactory,
                ContextMenuSelectedItem,
                RfUtils,
                Paginator) {
    
    //Paging
    $scope.pager = {pageSize: $rootScope.pageSize, page: 1, toolBarDisplay: 5};    
    
    $scope.fileNames = [];
    $scope.model = {    showAddProjectDiv: false,
                        showEditProject: false,
                        showOverviewDiv: false,
                        showSummaryDiv: false,
                        selectSize: 20,
                        projects: [],
                        donorList: [],
                        statusList: [],
                        selectedProject: {},
                        selectedSubPrograms: {},
                        budgetExecutionDataSets: [],
                        budgetForecastDataSets: [],
                        indicatorGroups: [],
                        metaAttributes: [],
                        metaAttributesById: [],
                        gridColumns: ['name', 'code', 'lastUpdated'],
                        sortColumn: 'name',
                        localSortColumn: 'name',
                        localReverse: false,
                        reverse: false,
                        itemsFetched: false,
                        metaAttributeValues: {}
                    };

    $scope.projectForm = {submitted: false};
    $scope.model.gridColumns = [{id: 'name', width: 'col-sm-8'}, {id: 'code', width: 'col-sm-3'}, {id: 'lastUpdated', width: 'col-sm-3'}];
    $scope.model.summaryColumns = ['name', 'code', 'totalCost', 'costByGovernment', 'startDate', 'endDate', 'extensionPossible'];
    
    MetaDataFactory.getAll('indicatorGroups').then(function(idgs){
        $scope.model.impactIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "IMPACT"});
        $scope.model.outcomeIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTCOME"});
        $scope.model.outputIndicatorGroups = $filter('filter')(idgs, {indicatorGroupType: "OUTPUT"});

        MetaAttributesFactory.getAttributesForObject( 'projectAttribute' ).then(function(attributes){
            angular.forEach(attributes, function(att){
                if(att.code === 'donorList' && att.optionSet && att.optionSet.options && att.optionSet.options.length > 0){
                    $scope.model.donorList = att.optionSet.options;
                }
                else if(att.code === 'projectStatus' && att.optionSet && att.optionSet.options && att.optionSet.options.length > 0){
                    $scope.model.statusList = att.optionSet.options;
                }
                else{
                    $scope.model.metaAttributes.push( att );
                }
                $scope.model.metaAttributesById[att.id] = att;
            });
            
            ResultsFrameworkFactory.getActive().then(function(response){
                $scope.model.activeResultsFramework = response && response.resultsFrameworks && response.resultsFrameworks[0] ? response.resultsFrameworks[0] : null;
                $scope.loadProjects();
            });
        });
    });

    $scope.loadProjects = function(){
        
        $scope.model.budgetExecutionDataSets = [];
        $scope.model.budgetForecastDataSets = [];
        $scope.model.projects = [];
        $scope.model.itemsFetched = false;
        DataSetFactory.getAll().then(function(dss){
            
            ProjectFactory.getAll( true, $scope.pager, $scope.model.searchText, $scope.model.sortColumn, $scope.model.reverse ).then(function(response){
                if( response && response.pager ){
                    response.pager.pageSize = response.pager.pageSize ? response.pager.pageSize : $scope.pager.pageSize;
                    $scope.pager = response.pager;
                    $scope.pager.toolBarDisplay = 5;

                    Paginator.setPage($scope.pager.page);
                    Paginator.setPageCount($scope.pager.pageCount);
                    Paginator.setPageSize($scope.pager.pageSize);
                    Paginator.setItemCount($scope.pager.total);                    
                }

                $scope.model.projects = response.projects ? response.projects : [];

                var assignForecastDataSets = [], assignedExecutionDataSets = [];
                angular.forEach($scope.model.projects, function(pr){
                    if( pr.budgetForecastDataSet ){
                        assignForecastDataSets.push( pr.budgetForecastDataSet.id);
                    }
                    if( pr.budgetExecutionDataSet ){
                        assignedExecutionDataSets.push( pr.budgetExecutionDataSet.id);
                    }

                    pr = RfUtils.convertToUserDate(pr, 'startDate');
                    pr = RfUtils.convertToUserDate(pr, 'endDate');
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
                
                $scope.model.budgetExecutionDataSets = orderByFilter($scope.model.budgetExecutionDataSets, '-name').reverse();
                $scope.model.budgetForecastDataSets = orderByFilter($scope.model.budgetForecastDataSets, '-name').reverse();
                
                $scope.model.itemsFetched = true;
            });        
        });        
    };
    
    $scope.showAddProject = function(){
        $scope.model.searchText = "";
        $scope.model.showAddProjectDiv = !$scope.model.showAddProjectDiv;
        $scope.model.showEditProject = false;
        $scope.model.showOverviewDiv = false;
        $scope.model.showSummaryDiv = false;
        $scope.model.metaAttributeValues = {};
    };

    $scope.showEditProject = function(){
        $scope.model.metaAttributeValues = {};
        $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();        
        $scope.model.metaAttributeValues = RfUtils.processMetaAttributeValues($scope.model.selectedProject, $scope.model.metaAttributeValues, $scope.model.metaAttributesById);        
        RfUtils.getFileNames($scope.model.selectedProject, $scope.model.metaAttributesById).then(function(res){
            $scope.fileNames = res;
        });
        
        $scope.model.showAddProjectDiv = false;
        $scope.model.showOverviewDiv = false;
        $scope.model.showSummaryDiv = false;
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
                    //reset form
                    $scope.cancel();
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
    
    $scope.showOverviewReport = function(){
        
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = false;
        $scope.model.showSummaryDiv = false;
        $scope.model.showOverviewDiv = !$scope.model.showOverviewDiv;
        
        if( $scope.model.showOverviewDiv ){            
            $scope.model.metaAttributeValues = {};
            $scope.model.selectedProject = ContextMenuSelectedItem.getSelectedItem();        
            $scope.model.metaAttributeValues = RfUtils.processMetaAttributeValues($scope.model.selectedProject, $scope.model.metaAttributeValues, $scope.model.metaAttributesById);        
            RfUtils.getFileNames($scope.model.selectedProject, $scope.model.metaAttributesById).then(function(res){
                $scope.fileNames = res;
            });

            $scope.model.contributingPrograms = {};

            angular.forEach($scope.model.selectedProject.subProgramms, function(sp){
                if( $scope.model.contributingPrograms[sp.programm.name] ){
                    $scope.model.contributingPrograms[sp.programm.name].push(sp.name);
                }
                else{
                    $scope.model.contributingPrograms[sp.programm.name] = [sp.name];
                }
            });
        }
    };
    
    $scope.showSummaryReport = function(){
        
        $scope.model.showSummaryDiv = !$scope.model.showSummaryDiv;
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = false;
        $scope.model.showOverviewDiv = false;
        
        if( $scope.model.showSummaryDiv ){
            $scope.model.projectSummary = {};
            $scope.model.projectBySubprogram = [];
            angular.forEach($scope.model.projects, function(project){
                angular.forEach(project.subProgramms, function(sp){                    
                    if($scope.model.projectBySubprogram[sp.name]){
                        $scope.model.projectBySubprogram[sp.name].push(project.name);
                    }
                    else{
                        $scope.model.projectBySubprogram[sp.name] = [project.name];
                    }
                    
                    if( $scope.model.projectSummary[sp.programm.name] ){                        
                        if($scope.model.projectSummary[sp.programm.name].subprograms.indexOf(sp.name) === -1){                            
                            $scope.model.projectSummary[sp.programm.name].subprograms.push(sp.name);
                        }                        
                        if($scope.model.projectSummary[sp.programm.name].projects.indexOf(project.name) === -1){
                            $scope.model.projectSummary[sp.programm.name].projects.push(project.name);
                        }
                    }
                    else{
                        $scope.model.projectSummary[sp.programm.name] = {subprograms: [sp.name], projects: [project.name]};
                    }
                });
            });
        }
    };
    
    $scope.setSelectedProject = function(project){
        $scope.model.selectedProject = project;
        ContextMenuSelectedItem.setSelectedItem($scope.model.selectedProject);
    };

    $scope.hideAddProject = function(){
        $scope.model.showAddProjectDiv = false;
        $scope.model.showEditProject = false;
        $scope.model.showOverviewDiv = false;
        $scope.model.showSummaryDiv = false;
        $scope.model.selectedProject = {};
        $scope.model.metaAttributeValues = {};
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
        
        var pr = angular.copy($scope.model.selectedProject);
        
        pr.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);                
        pr = RfUtils.convertToServerDate(pr, 'startDate');
        pr = RfUtils.convertToServerDate(pr, 'endDate');
        
        //form is valid, continue with adding
        ProjectFactory.create(pr).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'project_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            else {

                //add the new project to the grid                
                $scope.model.selectedProject.id = data.response.lastImported;
                $scope.model.projects.splice(0,0,$scope.model.selectedProject);

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
        var pr = angular.copy($scope.model.selectedProject);
        
        pr.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        pr = RfUtils.convertToServerDate(pr, 'startDate');
        pr = RfUtils.convertToServerDate(pr, 'endDate');
        
        //form is valid, continue with adding
        ProjectFactory.update(pr).then(function(data){
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
                },
                activeResultsFramework: function(){
                    return $scope.model.activeResultsFramework;
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
    
    $scope.jumpToPage = function(){        
        if($scope.pager && $scope.pager.page && $scope.pager.pageCount && $scope.pager.page > $scope.pager.pageCount){
            $scope.pager.page = $scope.pager.pageCount;
        }
        $scope.loadProjects();
    };
    
    $scope.resetPageSize = function(){
        $scope.pager.page = 1;        
        $scope.loadProjects();
    };
    
    $scope.getPage = function(page){    
        $scope.pager.page = page;
        $scope.loadProjects();
    };
    
    $scope.sortGrid = function(col){
        if ($scope.model.sortColumn && $scope.model.sortColumn === col){
            $scope.model.reverse = !$scope.model.reverse;            
        }
        else{
            $scope.model.sortColumn = col;
            $scope.model.reverse = false;
        }        
        $scope.loadProjects();      
    };
    
    $scope.sortLocalGrid = function(col){
        if ($scope.model.localSortColumn && $scope.model.localSortColumn === col){
            $scope.model.localReverse = !$scope.model.localReverse;            
        }
        else{
            $scope.model.localSortColumn = col;
            $scope.model.localReverse = false;
        }        
    };
    
    $scope.deleteFile = function(attributeId){        
        RfUtils.deleteFile(attributeId, $scope.model.metaAttributeValues, $scope.fileNames).then(function(res){            
            $scope.model.metaAttributeValues = res.obj;
            $scope.fileNames = res.fileNames;            
            $scope.updateProject();
        });
    };
});