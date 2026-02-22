sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.BaseController", {
        
        getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

        getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		}
    })
})