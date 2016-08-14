'use strict';

(function () {

    class RoleController {
        constructor($state, $stateParams, $rootScope, permitNut) {
            // Get user role in current nut.
            // var role = permitNut.role.name;
            // if ($state.is('pc.space.app.role') || !$state.includes('pc.space.app.role.' + role)) {
            //     // If current state just equal to 'pc.space.app.role' or not under 'pc.space.app.role'+role, 
            //     // we'll go to the right role home page.
            //     $state.go('pc.space.app.role.' + role);
            // }
        }
    }

    class RoleHomeController {
        constructor($state, $stateParams, $rootScope, BNut) {
            var ctrl = this;
            $rootScope.current.nut.permits = [];
            BNut.findAllUserPermitNut($rootScope.current.app._id).then(function (permitNuts) {
                for (var i = 0; i < permitNuts.length; i++) {
                    if (permitNuts[i].nut && permitNuts[i].nut.name == 'role') {
                        $rootScope.current.nut.permits.push(permitNuts[i].permit);
                        ctrl.nut = $rootScope.current.nut;
                    }
                }
            });

            this.getStateByPermit = function (permitName) {
                return 'pc.space.app.role.' + permitName.replace(/\./g, "_");
            }

            this.createCircle = function (formData) {
                BCircle.addCircle(formData);
            }
        }
    }

    class RoleAdminController {
        constructor() {

        }
    }

    class RoleAdminHomeController {

        constructor($stateParams, BRole) {

            this.deletingRole = {};
            var spaceId = $stateParams.spaceId;
            var ctrl = this;
            this.BRole = BRole;
            this.adminRoles = [];
            this.memberRoles = [];
            this.customerRoles = [];
            this.BRole.getSpaceRoles(spaceId).then(function (data) {
                angular.forEach(data, function (role) {
                    console.log(role);
                    if (role.fullname.indexOf("root.admin") == 0) {
                        ctrl.adminRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.member") == 0) {
                        ctrl.memberRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.customer") == 0) {
                        ctrl.customerRoles.push(role);
                    }
                });
            });
        }
    }

    class AdminRoleNutController {

        constructor(BRole, $rootScope, BNut, BPermit) {

            this.space = $rootScope.current.space;
            this.userSpace = $rootScope.current.userSpace;

            this.current = $rootScope.current;

            this.BNut = BNut;
            this.BPermit = BPermit;

            var self = this;

            this.checkboxCollection = {};

            angular.forEach(this.space.apps, function (app) {
                angular.forEach(app.nuts, function (nut) {
                    self.getNutPermitsInConfig(nut);
                })
            })

            //populate checkbox value
            BNut.findAllPermitRole(
                {
                    spaceId: self.current.space._id,
                    roleId: self.current.role._id
                }
            ).then(function (permitRoles) {
                angular.forEach(permitRoles, function (permitRole) {
                    self.checkboxCollection['nut_' + permitRole.nut._id + '_' + permitRole.permit.name] = true;
                })
            })

            //populate checkbox value
            /*
            angular.forEach(self.userSpace.apps, function (app) {
                angular.forEach(app.nuts, function (oNut) {
                    angular.forEach(oNut.permitRoles, function (permitRole) {
                        self.checkboxCollection['nut_' + oNut._id + '_' + permitRole.permit.name] = true;
                    })
                })
            })*/
        }

        getNutPermitsInConfig(nut) {
            var self = this;
            if (angular.isObject(nut.config)) {
                return nut.config.permits;
            } else {
                return self.BNut.getNutConfig(nut).then(function (config) {
                    nut.config = config;
                    return config.permits;
                });
            }
        }

        togglePermitCheckbox(nut, permitName) {
            var self = this;
            var checkboxCollection = self.checkboxCollection;

            var checkboxId = 'nut_' + nut._id + '_' + permitName;

            self.BPermit.findPermitRole(
                {
                    owner: 'nut',
                    ownerId: nut._id,
                    permitName: permitName,
                    roleId: self.current.role._id
                }
            ).then(function (permitRole) {
                if (permitRole && permitRole._id && permitRole._id > 0) {
                    self.BPermit.deletePermitRole(permitRole._id);
                } else {
                    self.BPermit.addBulkPermitRole(
                        [{
                            owner: 'nut',
                            ownerId: nut._id,
                            permit: permitName,
                            spaceId: self.current.space._id,//if use permit name, must provide spaceId
                            roleId: self.current.role._id
                        }]
                    )
                }
            });
        }
    }

    class AdminSpaceRoleController {
        constructor($stateParams, $state, BRole, toaster, $rootScope) {
            // alert("Space Role Cotroller");
            this.currentRole = {};
            this.newRole = {};
            this.toaster = toaster;
            this.$state = $state;
            var spaceId = $stateParams.spaceId;
            var ctrl = this;
            this.BRole = BRole;
            this.adminRoles = [];
            this.memberRoles = [];
            this.customerRoles = [];
            this.$rootScope = $rootScope;
            this.BRole.getSpaceRoles(spaceId).then(function (data) {
                angular.forEach(data, function (role) {
                    //console.log(role);
                    if (role.fullname.indexOf("root.role.admin") == 0) {
                        ctrl.adminRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.role.member") == 0) {
                        ctrl.memberRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.role.customer") == 0) {
                        ctrl.customerRoles.push(role);
                    }
                });
            });
        }


        save() {
            var newRole = {};
            newRole.spaceId = this.currentRole.spaceId;
            newRole.parent = this.currentRole._id;
            newRole.name = this.newRole.name;
            newRole.alias = this.newRole.alias;
            var ctrl = this;
            angular.element('#addRoleModal').on('hidden.bs.modal', function () {
                ctrl.$state.reload();
            });
            this.BRole.addChild(ctrl.currentRole._id, newRole).then(function (res) {
                ctrl.toaster.success("Success add role");
            });
        }

        delete() {
            var ctrl = this;
            angular.element('#deleteRoleModal').on('hidden.bs.modal', function () {
                ctrl.$state.reload();
            });
            this.BRole.deleteRole(ctrl.currentRole._id).then(function (res) {
                ctrl.toaster.success("Success delete role");
            });

        }

        showAdminNut(role) {
            var ctrl = this;
            this.$state.go('pc.space.app.role.adminSpaceRole.adminNut',
                {
                    spaceId: ctrl.$rootScope.current.space._id,
                    appId: ctrl.$rootScope.current.app._id,
                    nutId: ctrl.$rootScope.current.nut._id,
                    roleId: role._id
                });
        }
    }

    class AdminUserRoleController {
        constructor($stateParams, $state, BRole, BSpace) {
            this.BRole = BRole;
            this.BSpace = BSpace;
            this.spaceId = $stateParams.spaceId;
            this.$state = $state;
            this.spaceRoles = [];
            this.spaceUsers = [];
            this.currentUser = {};
            this.roles = [];
            var ctrl = this;


            ctrl.BRole.getSpaceRoles(ctrl.spaceId).then(function (data) {
                ctrl.spaceRoles = data;
            });


            ctrl.BSpace.getSpaceUsers(this.spaceId).then(function (data) {
                data.forEach(function (spaceUser) {
                    var a = spaceUser.roles;
                    spaceUser.roles = a.filter(function (role) {
                        return role.spaceId == ctrl.spaceId;
                    });
                });

                ctrl.spaceUsers = data.filter(function (spaceUser) {
                    return spaceUser.roles.length > 0;
                });
            });
        }


        startDialog(user) {
            console.log("mouse dowm");

            this.currentUser = user;
            this.roles = [];

            var ctrl = this;

            ctrl.spaceRoles.forEach(function (role) {
                var enabled = false;
                var index = ctrl.currentUser.roles.findIndex(function (r) {
                    return r._id == role._id;
                });

                if (index > -1)
                    enabled = true;

                role.checked = enabled;
                ctrl.roles.push(role);
            });

            console.log("total roles = " + ctrl.roles);
        }


        assignRole() {

            var ctrl = this;
            var toAdd = [];
            var toDel = [];

            this.roles.forEach(function (role) {
                var index = ctrl.currentUser.roles.findIndex(function (r) {
                    return r._id == role._id;
                });
                if (role.checked) {
                    if (index == -1) {//add if not find in user roles bu checked
                        toAdd.push(role);
                    }
                }
                else {
                    if (index > -1) { //delete if find in user roles but unchecked
                        toDel.push(role);
                    }
                }
            });
            if (toAdd.length > 0) {
                angular.element('#assignRoleModal').on('hidden.bs.modal', function () {
                    ctrl.$state.reload();
                });

                var toAddRoles = [];
                toAdd.forEach(function (role) {
                    var roleData = {};
                    roleData.userId = ctrl.currentUser._id;
                    roleData.roleId = role._id;

                    toAddRoles.push(roleData);
                });
                ctrl.BRole.addUserRoleBatch(toAddRoles).then(function (res) {
                    ctrl.toaster.success("Success add roles");

                });
            }
            if (toDel.length > 0) {
                angular.element('#assignRoleModal').on('hidden.bs.modal', function () {
                    ctrl.$state.reload();//.go('pc.joinSpace', null, { reload: true });
                });

                // toDelRoles = toDel.map(function (role) {
                //   var roleData = {};
                //   roleData.userId = ctrl.user._id;
                //   roleData.spaceId = ctrl.spaceId;
                //   roleData.roleId = role._id;

                //   return ctrl.BRole.deleteUserRole(roleData);
                // });
                // ctrl.$q.all(toDelRoles).then(function (res) {
                //   var a = res;
                //   var b = a.length;
                // });
            }

            //  ctrl.$state.go('user');//reload();

        } //method

        getLabelClassByRole(role) {
            var rolesArr = role.split('.');
            if (typeof rolesArr[0] == 'undefined') {
                return 'label-info';
            }
            switch (rolesArr[0]) {
                case 'admin': return 'label-danger';
                case 'member': return 'label-warning';
                case 'customer': return 'label-success';
                default: return 'label-info';
            }
        }

    } //class

    class RoleAdminAddRoleController {
        constructor($stateParams, BRole, toaster) {
            this.toaster = toaster;
            this.BRole = BRole;
            this.role = $stateParams.parent;
            this.name = this.role.name;
            this.alias = this.role.alias;
        }
        save() {
            var newRole = {};
            newRole.spaceId = this.role.spaceId;
            newRole.parent = this.role._id;
            newRole.name = this.name;
            newRole.alias = this.alias;
            var ctrl = this;

            this.BRole.addChild(this.role._id, newRole).then(function (res) {
                if (res.$resolved) {
                    ctrl.toaster.success("成功添加角色：" + res.alias);
                }
                else {
                    ctrl.toaster.error("添加加色失败.");
                }
            });
        }
    }

    class SpaceRoleController {
        constructor($stateParams, $state, BRole, toaster) {
            // alert("Space Role Cotroller");
            this.currentRole = {};
            this.newRole = {};
            this.toaster = toaster;
            this.$state = $state;
            var spaceId = $stateParams.spaceId;
            var ctrl = this;
            this.BRole = BRole;
            this.adminRoles = [];
            this.memberRoles = [];
            this.customerRoles = [];
            this.BRole.getSpaceRoles(spaceId).then(function (data) {
                angular.forEach(data, function (role) {
                    console.log(role);
                    if (role.fullname.indexOf("root.role.admin") == 0) {
                        ctrl.adminRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.role.member") == 0) {
                        ctrl.memberRoles.push(role);
                    }
                    else if (role.fullname.indexOf("root.role.customer") == 0) {
                        ctrl.customerRoles.push(role);
                    }
                });
            });
        }


        save() {
            var newRole = {};
            newRole.spaceId = this.currentRole.spaceId;
            newRole.parent = this.currentRole._id;
            newRole.name = this.newRole.name;
            newRole.alias = this.newRole.alias;
            var ctrl = this;
            angular.element('#addRoleModal').on('hidden.bs.modal', function () {
                ctrl.$state.reload();
            });
            this.BRole.addChild(ctrl.currentRole._id, newRole).then(function (res) {
                ctrl.toaster.success("Success add role");
            });
        }

        delete() {
            var ctrl = this;
            angular.element('#deleteRoleModal').on('hidden.bs.modal', function () {
                ctrl.$state.reload();
            });
            this.BRole.deleteRole(ctrl.currentRole._id).then(function (res) {
                ctrl.toaster.success("Success delete role");
            });

        }
    }


    class UserRoleController {
        constructor($stateParams, $state, BRole, BSpace) {
            this.BRole = BRole;
            this.BSpace = BSpace;
            this.spaceId = $stateParams.spaceId;
            this.$state = $state;
            this.spaceRoles = [];
            this.spaceUsers = [];
            this.currentUser = {};
            this.roles = [];
            var ctrl = this;


            ctrl.BRole.getSpaceRoles(ctrl.spaceId).then(function (data) {
                ctrl.spaceRoles = data;
            });


            ctrl.BSpace.getSpaceUsers(this.spaceId).then(function (data) {
                data.forEach(function (spaceUser) {
                    var a = spaceUser.roles;
                    spaceUser.roles = a.filter(function (role) {
                        return role.spaceId == ctrl.spaceId;
                    });
                });

                ctrl.spaceUsers = data.filter(function (spaceUser) {
                    return spaceUser.roles.length > 0;
                });
            });
        }


        startDialog(user) {
            console.log("mouse dowm");

            this.currentUser = user;

            var ctrl = this;

            ctrl.spaceRoles.forEach(function (role) {
                var enabled = false;
                var index = ctrl.currentUser.roles.findIndex(function (r) {
                    return r._id == role._id;
                });

                if (index > -1)
                    enabled = true;

                role.checked = enabled;
                ctrl.roles.push(role);
            });

            console.log("total roles = " + ctrl.roles);
        }


        assignRole() {

            var ctrl = this;
            var toAdd = [];
            var toDel = [];

            this.roles.forEach(function (role) {
                var index = ctrl.currentUser.roles.findIndex(function (r) {
                    return r._id == role._id;
                });
                if (role.checked) {
                    if (index == -1) {//add if not find in user roles bu checked
                        toAdd.push(role);
                    }
                }
                else {
                    if (index > -1) { //delete if find in user roles but unchecked
                        toDel.push(role);
                    }
                }
            });
            if (toAdd.length > 0) {
                angular.element('#assignRoleModal').on('hidden.bs.modal', function () {
                    ctrl.$state.reload();
                });

                var toAddRoles = [];
                toAdd.forEach(function (role) {
                    var roleData = {};
                    roleData.userId = ctrl.currentUser._id;
                    roleData.roleId = role._id;

                    toAddRoles.push(roleData);
                });
                ctrl.BRole.addUserRoleBatch(toAddRoles).then(function (res) {
                    ctrl.toaster.success("Success add roles");

                });
            }
            if (toDel.length > 0) {
                angular.element('#assignRoleModal').on('hidden.bs.modal', function () {
                    ctrl.$state.reload();//.go('pc.joinSpace', null, { reload: true });
                });

                // toDelRoles = toDel.map(function (role) {
                //   var roleData = {};
                //   roleData.userId = ctrl.user._id;
                //   roleData.spaceId = ctrl.spaceId;
                //   roleData.roleId = role._id;

                //   return ctrl.BRole.deleteUserRole(roleData);
                // });
                // ctrl.$q.all(toDelRoles).then(function (res) {
                //   var a = res;
                //   var b = a.length;
                // });
            }

            //  ctrl.$state.go('user');//reload();

        } //method

    } //class

    angular.module('billynApp.core')
        .controller('RoleController', RoleController)
        .controller('RoleHomeController', RoleHomeController)
        .controller('AdminSpaceRoleController', AdminSpaceRoleController)
        .controller('AdminUserRoleController', AdminUserRoleController)
        .controller('AdminRoleNutController', AdminRoleNutController)
        // .controller('SpaceRoleController', SpaceRoleController)
        // .controller('UserRoleController', UserRoleController)
        // .controller('RoleAdminController', RoleAdminController)
        // .controller('RoleAdminHomeController', RoleAdminHomeController)
        // .controller('RoleAdminAddRoleController', RoleAdminAddRoleController)
        ;
})();
