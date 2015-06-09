angular.module("manageEncounterTypes", [ "encounterTypeService", "ngDialog", "ui.router", "uicommons.filters" ])

    .config([ "$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise("/list");

        $stateProvider
            .state('list', {
                url: "/list",
                templateUrl: "templates/list.page",
                controller: "ManageEncounterTypesController"
            })
            .state("edit", {
                url: "/edit/:encounterTypeUuid",
                templateUrl: "templates/edit.page",
                params: {
                    encounterTypeUuid: null,
                },
                resolve: {
                    encounterType: function($stateParams, EncounterType) {
                        if ($stateParams.encounterTypeUuid) {
                            return EncounterType.get({ uuid: $stateParams.encounterTypeUuid, v: "full" });
                        }
                        return {};
                    }
                },
                controller: "EditEncounterTypeController"
            });
    }])

    .controller("ManageEncounterTypesController", [ "$scope", "$state", "EncounterType", "ngDialog",
        function($scope, $state, EncounterType, ngDialog) {
            function sortWithRetiredLast(list) {
                return _.sortBy(list, "retired");
            }

            function loadEncounterTypes() {
                // TODO standard function for failure of REST call
                EncounterType.query({ v: "default", includeAll: true }).$promise.then(function(response) {
                    // TODO handle multiple pages of results in a standard way
                    $scope.encounterTypes = sortWithRetiredLast(response.results);
                });
            }

            $scope.retire = function(encounterType) {
                ngDialog.openConfirm({
                    showClose: false,
                    closeByEscape: true,
                    closeByDocument: true,
                    template: "templates/retireEncounterTypeDialog.page",
                    controller: function($scope) {
                        $scope.encounterType = encounterType;
                    }
                }).then(function(reason) {
                    EncounterType.delete({
                        uuid: encounterType.uuid,
                        reason: reason
                    }).$promise.then(function() {
                        loadEncounterTypes();
                    });
                });
            }

            $scope.unretire = function(encounterType) {
                // will fail until RESTWS-456
                EncounterType.save({
                    uuid: encounterType.uuid,
                    retired: false
                }).$promise.then(function() {
                    loadEncounterTypes();
                })
            }

            $scope.edit = function(encounterType) {
                $state.go("edit", { encounterTypeUuid: encounterType.uuid });
            }

            loadEncounterTypes();
        }])

    .controller("EditEncounterTypeController", [ "$scope", "$state", "EncounterType", "encounterType",
        function($scope, $state, EncounterType, encounterType) {
            $scope.encounterType = encounterType;

            $scope.save = function() {
                // TODO: utility function for doing this, until RESTWS-460 is fixed
                var toSave = {
                    uuid: $scope.encounterType.uuid,
                    name: $scope.encounterType.name,
                    description: $scope.encounterType.description
                }
                EncounterType.save(toSave).$promise.then(function() {
                    $state.go("list");
                    emr.successMessage(emr.message("uicommons.generalSavedNotification"));
                }, function() {
                    // TODO handle server-side errors
                })
            }
        }]);