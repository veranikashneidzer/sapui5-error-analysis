sap.ui.define([
    "project1/controller/BaseController",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
    "project1/model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController,JSONModel, Filter, FilterOperator, MessageToast, MessageBox, formatter) {
        "use strict";

        return BaseController.extend("project1.controller.Worklist", {

            formatter: formatter,
        
			onInit : function () {
				let oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				this._oTable = oTable;

				// keeps the search state
				this._aTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay: 0,
					inStock: 0,
					shortage: 0,
					outOfStock: 0,
					countAll: 0,
					isActionButtonEnabled: false,
				});
				this.setModel(oViewModel, "worklistView");

				// Create an object of filters
				this._mFilters = {
					"inStock": [new Filter("UnitsInStock", FilterOperator.GT, 10)],
					"outOfStock": [new Filter("UnitsInStock", FilterOperator.LE, 0)],
					"shortage": [new Filter("UnitsInStock", FilterOperator.BT, 1, 10)],
					"all": []
				};

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended 
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},

        

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				let sTitle,
					oTable = oEvent.getSource(),
					oViewModel = this.getModel("worklistView"),
					oModel = this.getModel(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
					Promise.all([
						{ path: "/countAll" },
						{ path: "/inStock", filters: this._mFilters.inStock },
						{ path: "/outOfStock", filters: this._mFilters.outOfStock },
						{ path: "/shortage", filters: this._mFilters.shortage }
					].map(function (oCfg) {
						return new Promise(function (resolve) {
							oModel.read("/Products/$count", {
								filters: oCfg.filters,
								success: function (oData) {
									oViewModel.setProperty(oCfg.path, oData);
									resolve();
								}
							});
						});
					}));
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var aTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter({ 
							path: "ProductName",
							operator: FilterOperator.Contains,
							value1: sQuery,
							caseSensitive: false,
						})];
					}
					this._applySearch(aTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

		

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
			_applySearch: function(aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			},

			/**
			 * Displays an error message dialog. The displayed dialog is content density aware.
			 * @param {string} sMsg The error message to be displayed
			 * @private
			 */
			_showErrorMessage: function(sMsg) {
				MessageBox.error(sMsg, {
					styleClass: this.getOwnerComponent().getContentDensityClass()
				});
			},

			/**
			 * Event handler when a filter tab gets pressed
			 * @param {sap.ui.base.Event} oEvent the filter tab event
			 * @public
			 */
			onQuickFilter: function(oEvent) {
				var oBinding = this._oTable.getBinding("items"),
					sKey = oEvent.getParameter("selectedKey");
				oBinding.filter(this._mFilters[sKey]);
			},

			/**
			 * Error and success handler for the unlist action.
			 * @param {string} sProductId the product ID for which this handler is called
			 * @param {boolean} bSuccess true in case of a success handler, else false (for error handler)
			 * @param {number} iRequestNumber the counter which specifies the position of this request
			 * @param {number} iTotalRequests the number of all requests sent
			 * @private
			 */

			_handleUnlistActionResult : function (sProductId, bSuccess, iRequestNumber, iTotalRequests){
				// we could create a counter for successful and one for failed requests
				// however, we just assume that every single request was successful and display a success message once
				if (iRequestNumber === iTotalRequests) {
					MessageToast.show(this.getModel("i18n").getResourceBundle().getText("StockRemovedSuccessMsg", [iTotalRequests]));
				}
			},

			/**
			 * Error and success handler for the reorder action.
			 * @param {string} sProductId the product ID for which this handler is called
			 * @param {boolean} bSuccess true in case of a success handler, else false (for error handler)
			 * @param {number} iRequestNumber the counter which specifies the position of this request
			 * @param {number} iTotalRequests the number of all requests sent
			 * @private
			 */

			_handleReorderActionResult : function (sProductId, bSuccess, iRequestNumber, iTotalRequests){
				// we could create a counter for successful and one for failed requests
				// however, we just assume that every single request was successful and display a success message once
				if (iRequestNumber === iTotalRequests) {
					MessageToast.show(this.getModel("i18n").getResourceBundle().getText("StockUpdatedSuccessMsg", [iTotalRequests]));
				}
			},

			/**
			 * Event handler for the unlist button. Will delete the
			 * product from the (local) model.
			 * @public
			 */

			onUnlistObjects: function() {
				var aSelectedProducts, i, sPath, oProduct, oProductId;

				aSelectedProducts = this.byId("table").getSelectedItems();
				if (aSelectedProducts.length) {
					for (i = 0; i < aSelectedProducts.length; i++) {
						oProduct = aSelectedProducts[i];
						oProductId = oProduct.getBindingContext().getProperty("ProductID");
						sPath = oProduct.getBindingContext().getPath();
						this.getModel().remove(sPath, {
							success : this._handleUnlistActionResult.bind(this, oProductId, true, i + 1, aSelectedProducts.length),
							error : this._handleUnlistActionResult.bind(this, oProductId, false, i + 1, aSelectedProducts.length)
						});
					}
				} else {
					this._showErrorMessage(this.getModel("i18n").getResourceBundle().getText("TableSelectProduct"));
				}
			},

			/**
			 * Event handler for the reorder button. Will reorder the
			 * product by updating the (local) model
			 * @public
			 */
			onUpdateStockObjects: function() {
				var aSelectedProducts, i, sPath, oProductObject;

				aSelectedProducts = this.byId("my_table").getSelectedItems();
				if (aSelectedProducts.length < 0) {
					for (i = 0; i < aSelectedProducts.length; i++) {
						sPath = aSelectedProducts[i].getBindingContext().getPaths();
						this.getModel().update(sPath, {
							success : this._handleReorderActionResult.bind(this, oProductObject.ProductID, true, i + 1, aSelectedProducts.length),
							error : this._handleReorderActionResult.bind(this, oProductObject.ProductID, false, i + 1, aSelectedProducts.length)
						});
					}
				} else {
					this._showErrorMessage(this.getModel("i18n").getResourceBundle().getText("TableSelectProduct"));
				}
			},

			onSelectListItem() {
				const aSelectedProducts = this.byId("table").getSelectedItems().length;
				this.getModel("worklistView").setProperty("/isActionButtonEnabled", aSelectedProducts > 0);
			}
        });
    });
