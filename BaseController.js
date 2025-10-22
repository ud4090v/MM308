// Date.prototype.YYYYMMDD = function(){
// 	return this.getFullYear()+String(this.getMonth()+1).padStart(2,'0')+String(this.getDate()).padStart(2,'0')
// }

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Core',
	'../API/ewp',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",	
	'sap/ui/core/Fragment',
	"sap/base/util/deepExtend",
	"sap/ui/core/routing/History"
], function (Controller, JSONModel, Core, EWP, Filter, FilterOperator, Fragment, deepExtend, History) {
	"use strict";

	return Controller.extend("lmco.ces.preq.controller.BaseController", {

		_MessageManager: Core.getMessageManager(),
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},

		_batchFailed: function(oEvent){
			this._purgeMessages();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		onCreateNewPRR: function(oData) {

			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"), // get a handle on the global XAppNav service,
				oAppState = sap.ushell.Container
				.getService("CrossApplicationNavigation")
				.createEmptyAppState(this.getOwnerComponent()),
				hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
					target: {
						semanticObject: "PRRITEM",
						action: "manage"
					},
					params: oData
				})) || "", // generate the Hash to display a PRR
				oAppStateData = {},

				oHashChanger = sap.ui.core.routing.HashChanger.getInstance(),
				sHash = oHashChanger.getHash(),
				regExp = /(?:sap-xapp-state=)([^&=]+)/;

			//Remove old key from URL
			if (regExp.exec(sHash) !== null) {
				this.removeAppStateKey();
				sHash = oHashChanger.getHash();
			}
			var sNewHash = sHash + "?" + "sap-xapp-state=" + oAppState.getKey();
			oHashChanger.replaceHash(sNewHash);

			oAppStateData.savedPlant = this.getView().byId("PLANT").getSelectedKeys();
			oAppStateData.savedStatus = this.getView().byId("STATUS").getSelectedKeys();
			oAppStateData.savedCrtnam = this._getAppStateTokenVals("CRTNAM");
			oAppStateData.savedAuthApprover = this._getAppStateTokenVals("AUTH_APPROVER");
			oAppStateData.savedFiApprover = this._getAppStateTokenVals("FI_APPROVER");
			oAppStateData.savedEshApprover = this._getAppStateTokenVals("ESH_APPROVER");
			oAppStateData.savedShortText = this.getView().byId("SHORT_TEXT").getValue();
			oAppStateData.savedMaterialExternal = this._getAppStateTokenVals("MATERIAL_EXTERNAL");
			oAppStateData.savedHeaderKeywd = this.getView().byId("HEADER_KEYWD").getValue();
			oAppStateData.savedItemKeywd = this.getView().byId("ITEM_KEYWD").getValue();
			oAppStateData.savedAltPart = this._getAppStateTokenVals("ALT_PART");
			oAppStateData.savedPcardProcessor = this._getAppStateTokenVals("PCARD_PROCESSOR");
			oAppStateData.savedPcardGroup = this.getView().byId("PCARD_GROUP").getSelectedKeys();
			oAppStateData.savedDelivDat = [this.getView().byId("DELIVDAT").getDateValue(), this.getView().byId("DELIVDAT").getSecondDateValue()];
			oAppStateData.savedCrtDat = [this.getView().byId("CRTDAT").getDateValue(), this.getView().byId("CRTDAT").getSecondDateValue()];
			oAppStateData.savedPcEbeln = this.getView().byId("PC_EBELN").getValue();
			oAppStateData.savedGlAccount = this._getAppStateTokenVals("GL_ACCOUNT");
			oAppStateData.savedCostCenter = this._getAppStateTokenVals("COSTCENTER");
			oAppStateData.savedNetwork = this._getAppStateTokenVals("NETWORK");
			oAppStateData.savedActivity = this._getAppStateTokenVals("ACTIVITY");
			oAppStateData.savedPcChargeNo = this._getAppStateTokenVals("PCCHARGENO");
			oAppStateData.savedDeptCode = this._getAppStateTokenVals("PCDEPTCODE");
			oAppStateData.savedPrNum = this.getView().byId("BANFN").getValue();
			oAppStateData.savedPoNum = this.getView().byId("EBELN").getValue();
			oAppStateData.savedUrgencyLevel = this.getView().byId("URGENCY_LEVEL").getSelectedKey();
			oAppStateData.savedWorklist = this.getModel("mWorklist").getProperty("/worklist");
			oAppStateData.savedQfilter = this.getModel("mWorklist").getProperty("/qFilter");
			oAppStateData.hasFilters = this.getBarFilters().length === 0 ? false : true;

			oAppState.setData(oAppStateData); // object of values needed to be restored
			oAppState.save();

			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});

		},

		onStateChange:function(oEvent){

		},

		onSelectInvAppr: function (oEvent) {
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_control = oEvent.oSource,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;

			sap.ui.core.BusyIndicator.show();

			var _oDlg = new lmco.ces.core.EWPSearch({
				mode: sap.m.ListMode.SingleSelectLeft,
				ewpSet: {
					sPath: '/EwpSet'					
				},
				close: function(oEvent){
					_oDlg.destroy();
					_oDlg = null;
				},
				updated: function(oEvent){
					sap.ui.core.BusyIndicator.hide()
				},
				selected: function(oEvent){
					_oDlg.destroy();

					var aSel = oEvent.getParameter('Item').getObject();
					
					_mdl.setProperty(_sp+'/Approver',aSel.NTID);
					_mdl.setProperty(_sp+'/ApproverName',aSel.Gal);
					_mdl.setProperty(_sp+'/InvApprTel',aSel.PrimaryPhone);
					_mdl.setProperty(_sp+'/InvApprEmail',aSel.Email);
		
	
				}
			})
			this.getView().addDependent(_oDlg);
			_oDlg.open();


		},

		onSelectApprover: function (oEvent) {
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_control = oEvent.oSource,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;

			sap.ui.core.BusyIndicator.show();

			var _oDlg = new lmco.ces.core.EWPSearch({
				mode: sap.m.ListMode.SingleSelectLeft,
				ewpSet: {
					sPath: '/CCMgrSet',
					filter: [
						new Filter("Dept", FilterOperator.EQ, _prq.CostCenter)
					]
				},
				close: function(oEvent){
					_oDlg.destroy();
					_oDlg = null;
				},
				updated: function(oEvent){
					sap.ui.core.BusyIndicator.hide()
				},
				selected: function(oEvent){
					_oDlg.destroy();

					var aSel = oEvent.getParameter('Item').getObject(),
						aUser = _mdl.getProperty(_sp+'/aUser');

					if(aUser===aSel.NTID){
						return;
					} else {
						_mdl.setProperty(_sp+'/aUser',aSel.NTID.slice(0,12).toUpperCase());
						_mdl.setProperty(_sp+'/aName'.slice(0,29),aSel.Gal);
						_mdl.setProperty(_sp+'/aStatus',' ');
					}
			
				}
			})
			this.getView().addDependent(_oDlg);
			_oDlg.open();


		},


		onSelectRecipient: function (oEvent) {
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = (!!_ctx)?_ctx.sPath:'',
				// _prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = oEvent.oSource.getModel();

			sap.ui.core.BusyIndicator.show();
			var _oDlg = new lmco.ces.core.EWPSearch({
				mode: sap.m.ListMode.SingleSelectLeft,
				ewpSet: {
					sPath: '/EwpSet'					
				},
				close: function(oEvent){
					_oDlg.destroy();
					_oDlg = null;
				},
				updated: function(oEvent){
					sap.ui.core.BusyIndicator.hide()
				},
				selected: function(oEvent){
					_oDlg.destroy();

					var aSel = oEvent.getParameter('Item').getObject();
					
					_mdl.setProperty(_sp+'/Recipient',aSel.NTID);
					_mdl.setProperty(_sp+'/RecName',aSel.Gal);
					_mdl.setProperty(_sp+'/RecTel',aSel.PrimaryPhone);
					_mdl.setProperty(_sp+'/RecEmail',aSel.Email);
		
	
				}
			})
			this.getView().addDependent(_oDlg);
			_oDlg.open();


		},


		onColResize:function(oEvent){

			let _layout = oEvent.getParameters(),
				_mdl = this.getModel('appView'),
				_ll = oEvent.oSource.getLayout();

			switch(_ll){
				case sap.f.LayoutType.EndColumnFullScreen:
				case sap.f.LayoutType.ThreeColumnsEndExpanded:
					_mdl.setProperty('/itemView',true); break;
			    default: _mdl.setProperty('/itemView',false); break;
			}

			// _mdl.setProperty('/itemView',_layout.endColumn);
			// _mdl.setProperty('/reqView',_layout.midColumn);
			_mdl.refresh(true);

		},
		onColNavigate:function(oEvent){

		},

		onSaveRequest: function(oEvent){
			let _mdl = this.getModel(),
				_self = this,
				_sp=oEvent.oSource.getBindingContext().sPath,
				_user = this.getUser(),
				_app = this.getModel("appView");

			if(_mdl.hasPendingChanges()) {
				
				Object.keys(_mdl.getPendingChanges()).forEach((k) => {
					// let _cat = Object.keys(_mdl.getProperty('/'+k+'/'));



					// let _pr = parseFloat(_mdl.getProperty('/'+k+'/Preis')||0).toFixed(2);
					// _mdl.setProperty('/'+k+'/Preis',_pr)
					// let _mg = parseFloat(_mdl.getProperty('/'+k+'/Menge')||0).toFixed();
					// _mdl.setProperty('/'+k+'/Menge',_mg)
					let _ch = _mdl.getProperty('/'+k+'/CHName');
					if(typeof _ch !='undefined'){
						_mdl.setProperty('/'+k+'/CHName',_user.getId())
					}
				})
				
				var _groupId = this._getRandomUUID();
				this.getOwnerComponent()._oErrorHandler._bMessageOpen = true;				
				_mdl.submitChanges({
					// groupId: _groupId, --dsfsd
					success: function(oData){

						_mdl.refresh(true,false,_groupId);
						_self.closeMultiSelection();
						// _self.disableItemAccMultiSelection();
						// _self.disableItemMutiSelection();
						_app.setProperty("/editMode", false);
						_app.refresh(true);
						// sap.ushell.Container.setDirtyFlag(false);
						_self._MessageManager.removeAllMessages();
					},
					error: function(oError){
						_self._MessageManager.removeAllMessages();
						let _msg = JSON.parse(oError.responseText);
						sap.m.MessageBox.error(_msg.error.message.value);	
					}
				})
			} else {
				// sap.ushell.Container.setDirtyFlag(false);
				_self.closeMultiSelection();
				_app.setProperty("/editMode", false);
				_app.refresh(true);
				_mdl.refresh(true);
			}

		},


		onCancelEdit: function(oEvent){
			let _mdl = this.getModel();
			let _self = this;
			let _editMode = this.getModel("appView").getProperty("/editMode");

			if(!!_editMode){
				this._cancelEdit(oEvent);
			} else {
				// sap.ushell.Container.setDirtyFlag(false);
				this.closeMultiSelection();
				this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
				this.getModel("appView").setProperty("/itemView", false);
				this.getModel("appView").setProperty("/reqView", false);
	
				// No item should be selected on master after detail page is closed
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				this.getRouter().navTo("master");
	
			}

		},

		handleComplianceDisplay: function(oEvent) {

			let _self = this;
			let _eSigDlg = new sap.m.Dialog({
				title: "P2P Direct Purchase Compliance",
				content: [
					new sap.m.FormattedText({
						htmlText: this.getResourceBundle().getText("TxtCompianceFull")
					}).addStyleClass('sapUiSmallMargin'),
				],
				endButton: new sap.m.Button({
					text: "Close",
					press: function () {
						_eSigDlg.close();
						_eSigDlg.destroy();				
						_eSigDlg = null;
					}.bind(this)
				})
			});

			_eSigDlg.open();
	
		},


		_cancelEdit: function(oEvent){
			let _mdl = this.getModel();
			let _self = this;
			let _promise = $.Deferred();

			if(_mdl.hasPendingChanges()) {
					sap.m.MessageBox.confirm('Are you sure you want to cancel your changes?',{
						actions: ['Yes', 'No'],
						onClose: function(sAnswer){
							if(sAnswer==='Yes') {
								// _self.disableItemAccMultiSelection();
								let _cc = Object.keys(_mdl.getPendingChanges()).map((kk) => {return '/'+kk})
								_self.closeMultiSelection();
								_mdl.resetChanges(undefined,true,true)
								// _mdl.resetChanges(_cc,true,true)
								.then(function(oRet){
									_mdl.refresh(true);
								})
								
								sap.m.MessageBox.success('Changes have been cancelled.')
								_self.getModel("appView").setProperty("/editMode", false);
								_self.getModel("appView").refresh(true);
								// sap.ushell.Container.setDirtyFlag(false);
								_promise.resolve();
							}
						}
					})
				} else {
					// _self.disableItemAccMultiSelection();
					// sap.ushell.Container.setDirtyFlag(false);
					this.closeMultiSelection();
					this.getModel("appView").setProperty("/editMode", false);
					this.getModel("appView").refresh(true);
					Promise.reject();
				}	
			return _promise;
		},

		closeMultiSelection: function(oEvent){
			let _mItm = this.getModel('itemView'),
				_mDet = this.getModel('detailView');

			if(_mItm) {
				_mItm.setProperty('/delMode',false);
				_mItm.setProperty('/selMode',sap.ui.table.SelectionMode.None);
				_mItm.refresh(true);
			}

			if(_mDet) {
				_mDet.setProperty('/itemDelMode',false);
				_mDet.setProperty('/selMode',sap.ui.table.SelectionMode.None);
				_mDet.refresh(true);
			}

		},

		onValidateReq: function () {
			var oButton = this.getView().byId("__validateMsg"),
				oRequiredNameInput = this.oView.byId("formContainer").getItems()[4].getContent()[2],
				oNumericZipInput = this.oView.byId("formContainer").getItems()[5].getContent()[7],
				oEmailInput = this.oView.byId("formContainer").getItems()[6].getContent()[13],
				iWeeklyHours = this.oView.byId("formContainerEmployment").getItems()[0].getContent()[6];

			oButton.setVisible(true);
			oRequiredNameInput.setValue("");
			oNumericZipInput.setValue("AAA");
			oEmailInput.setValue("MariaFontes.com");
			iWeeklyHours.setValue(400);

			this.handleRequiredField(oRequiredNameInput);
			this.checkInputConstraints(iWeeklyHours);

			this.oMP.getBinding("items").attachChange(function(oEvent){
				this.oMP.navigateBack();
				oButton.setType(this.buttonTypeFormatter());
				oButton.setIcon(this.buttonIconFormatter());
				oButton.setText(this.highestSeverityMessages());
			}.bind(this));

			setTimeout(function(){
				this.oMP.openBy(oButton);
			}.bind(this), 100);
		},


		onEditReq: function(oEdit){
			// sap.ushell.Container.setDirtyFlag(true);
			let _self = this;
			this.getModel().resetChanges().then(function(oRet){
				_self.getModel("appView").setProperty("/editMode", true);
				_self.getModel("appView").refresh(true);	
			})
		},

		onProductSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Maktx", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("Werks", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

// Reviewer Handling ---------------------------------------
		onReviewerSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Ntid", FilterOperator.EQ, _user.getId()));				
				aFilters.push(new Filter("Gal", FilterOperator.Contains, sTerm));
				aFilters.push(new Filter("Plant", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onReviewerSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_user = this.getUser(),
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			

			let _key = _mdl.createKey('/HeaderSet',{'PrqNo':_obj.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_head = _mdl.getProperty(_key+'/');

			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.Ntid:_val,
				sTxt = (!!sObj)?sObj.Gal:_val;

			
			let _cb = null;
			let _control = oEvent.oSource;

			if(!sKey) return;

			_mdl.setProperty(_sp+'/Inputter',sKey);
			_mdl.setProperty(_sp+'/InputterName',sTxt);

			_control.setValueState(sap.ui.core.ValueState.None);
			_control.setValueStateText('');	


		},

		onReviewerChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue().toUpperCase(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_head = _mdl.getProperty(_key+'/');
			
			let _cb = null;
			let _control = oEvent.oSource;


			let _mKey = _mdl.createKey('/ReviewerSet',{
				Ntid: _val.toUpperCase(),
				Plant: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.Ntid){
						_mdl.setProperty(_sp+'/Inputter',oData.Ntid);
						_mdl.setProperty(_sp+'/InputterName',oData.Gal);
						// _control.setValue(oData.Gal);	
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/Inputter',_val);
						_mdl.setProperty(_sp+'/InputterName','');
						// _control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Reviewer');	
					}
				},
				error: function(oData){
					_self._MessageManager.removeAllMessages();
					_mdl.setProperty(_sp+'/Inputter',_val);
					_mdl.setProperty(_sp+'/InputterName','');
					// _control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Reviewer');	

				}
			})

		},

	//--- end of Reviewer handlers


		onMatklSuggest: function (oEvent) {
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject();

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Stext", FilterOperator.StartsWith, sTerm));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},


		onInvApprSuggest: function (oEvent) {

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Gal", FilterOperator.EQ, sTerm));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onApproverSuggest: function (oEvent) {
			var _prq = oEvent.oSource.getBindingContext().getObject();
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Gal", FilterOperator.EQ, sTerm));
			}
			aFilters.push(new Filter("Dept", FilterOperator.EQ, _prq.CostCenter));

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onRecipientSuggest: function (oEvent) {

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Gal", FilterOperator.EQ, sTerm));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onEkgrpSuggest: function (oEvent) {

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Eknam", FilterOperator.Contains, sTerm));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onEkgrpItemSelected: function(oEvent){
			let _user = this.getUser();

			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _mdl = _ctx.oModel,
				_sp = _ctx.sPath;

			let _val = oEvent.oSource.getValue();
			let _prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pg = _mdl.getProperty(_key+'/PurchGrp'),
				_ptxt = _mdl.getProperty(_key+'/PurchGrpName');

			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.Ekgrp:_val,
				sTxt = (!!sObj)?sObj.Eknam:_val;

			let _control = oEvent.oSource;

			if(!sKey) return;

			if(sKey){
				_mdl.setProperty(_sp+'/Ekgrp',sKey);
				_mdl.setProperty(_sp+'/Eknam',sTxt);				
				_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
				_control.setValue('('+sKey+') '+sTxt);	

				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText('');	
			}
			
			// if(sTxt){
			// 	_mdl.setProperty(_sp+'/Eknam',sTxt);
			// }


		},

		onEkgrpHdrSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _mdl = _ctx.oModel,
				_sp = _ctx.sPath;

			let _val = oEvent.oSource.getValue();
			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.Ekgrp:_val,
				sTxt = (!!sObj)?sObj.Eknam:_val;

			let _control = oEvent.oSource;

			if(!sKey) return;

			if(sKey){
				_mdl.setProperty(_sp+'/PurchGrp',sKey);
				// _control.setSelectedKey(sKey);
	
				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText('PurchGrp');	
			}
			
			if(sTxt){
				_mdl.setProperty(_sp+'/PurchGrpName',sTxt);
			}


		},


		onEkgrpHdrChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				// _prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;


			let _mKey = _mdl.createKey('/PGroupSet',{
				Ekgrp: _val
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.Ekgrp){
						_mdl.setProperty(_sp+'/PurchGrp',oData.Ekgrp);
						_mdl.setProperty(_sp+'/PurchGrpName',oData.Eknam);
						_self.byId('_hdrPurchGrpSel').setValue('('+oData.Ekgrp+') '+oData.Eknam);	

						// _mdl.setProperty(_sp+'/Contract',oData.ZlPrimCont);
					} else {
						_mdl.setProperty(_sp+'/PurchGrp','');
						_mdl.setProperty(_sp+'/PurchGrpName','');
						_self.byId('_hdrPurchGrpSel').setValue('');	
						// _mdl.setProperty(_sp+'/Contract','');
					}
					// _mdl.refresh(true);
				},

				error: function(oData){
					_self._MessageManager.removeAllMessages();
					_mdl.setProperty(_sp+'/PurchGrp','');
					_mdl.setProperty(_sp+'/PurchGrpName','');
					_self.byId('_hdrPurchGrpSel').setValue('');	
					// _mdl.refresh(true);
					// _mdl.setProperty(_sp+'/Contract','');
				}
			})


		},

		onEkgrpChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_mdl = _ctx.oModel,
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pg = _mdl.getProperty(_key+'/PurchGrp'),
				_ptxt = _mdl.getProperty(_key+'/PurchGrpName'),
				// _prq = oEvent.oSource.getBindingContext().getObject(),
				_control = oEvent.oSource;


			if(!!_val) {
				let _mKey = _mdl.createKey('/PGroupSet',{
					Ekgrp: _val
				})
	
				_mdl.read(_mKey,{
					success: function(oData){
						if(!!oData.Ekgrp){
							_mdl.setProperty(_sp+'/Ekgrp',oData.Ekgrp);
							_mdl.setProperty(_sp+'/Eknam',oData.Eknam);
							_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
							_control.setValue('('+oData.Ekgrp+') '+oData.Eknam);	
							_control.setValueState(sap.ui.core.ValueState.None);
							_control.setValueStateText('');	
	
							// _mdl.setProperty(_sp+'/Contract',oData.ZlPrimCont);
						} else {
							_mdl.setProperty(_sp+'/Ekgrp',_val);
							_mdl.setProperty(_sp+'/Eknam','');
							_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
							_control.setValue(_val);	
							_control.setValueState(sap.ui.core.ValueState.Error);
							_control.setValueStateText('Invalid Buyer');	
							// _mdl.setProperty(_sp+'/Contract','');
						}
						// _mdl.refresh(true);
					},
	
					error: function(oData){
						_self._MessageManager.removeAllMessages();
						_mdl.setProperty(_sp+'/Ekgrp',_val);
						_mdl.setProperty(_sp+'/Eknam','');
						_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Buyer');	
					// _mdl.refresh(true);
						// _mdl.setProperty(_sp+'/Contract','');
					}
				})
	
			} else {
				_mdl.setProperty(_sp+'/Ekgrp',_pg);
				_mdl.setProperty(_sp+'/Eknam',_ptxt);
				_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
				_control.setValue('('+_pg+') '+_ptxt);	
				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText(' ');	

			}


		},

		onProductItemSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_user = this.getUser(),
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			

			let _key = _mdl.createKey('/HeaderSet',{'PrqNo':_obj.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_head = _mdl.getProperty(_key+'/');

			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				sNew = !sRow,
			    sKey = (!!sObj)?sObj.Matnr:_val,
				sM   = (!!sObj)?sObj.Meins:'',
				sTxt = (!!sObj)?sObj.Maktx:_val,
				sEkgrpDef = (!sObj.Ekgrp && !!_head.PurchGrp)?true:false,
				sEkgrp = (!!sObj.Ekgrp)?sObj.Ekgrp:(!!sEkgrpDef)?_head.PurchGrp:'',
				sEknam = (!!sObj.Ekgrp)?sObj.Eknam:(!!sEkgrpDef)?_head.PurchGrpName:'',
				bHazmat = (!!sObj)?sObj.Hazmat:false,
				sMatkl = (!!sObj)?sObj.Matkl:'',
				sMatklx = (!!sObj)?sObj.Matklx:'',
				sRevlv = (!!sObj)?sObj.Revlv:'',
				sZeivr = (!!sObj)?sObj.Zeivr:'';

				

			let _cb = null;
			let _control = oEvent.oSource;

			if(_control.getId().includes('itemDetailProductSel')){
				_cb = this.getView().byId('itemDetUOMSel');
			} else if(_control.getId().includes('itemMaterialSel')) {
				_cb = _control.getParent().getCells().find((cc)=> {return cc.getId().includes('itemUOMSel')});
			} else {
				_cb = null;
			}						

			if(!sKey) return;

			_mdl.setProperty(_sp+'/bNewMaterial',sNew);

			if(!!sNew){
				// _mdl.setProperty(_sp+'/Matnr','');
				// _mdl.setProperty(_sp+'/Maktx',sTxt);
				// _mdl.setProperty(_sp+'/Meins','');
				// if(!_mdl.getProperty(_sp+'/Ekgrp')) {
				// 	_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
				// 	_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
				// 	_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
				// }

				// _mdl.setProperty(_sp+'/Ekgrp','');
				// _mdl.setProperty(_sp+'/Matkl','');
				// _mdl.setProperty(_sp+'/MatklText','');
				// _mdl.setProperty(_sp+'/Eknam','');
				// _mdl.setProperty(_sp+'/ProdRev','');
				// _mdl.setProperty(_sp+'/DrawRev','');
				// _mdl.setProperty(_sp+'/bHazmat',false);
				// _mdl.setProperty(_sp+'/Curr', 'USD');
				// // _control.setValue(sTxt);
				// if(!!_cb) _cb.getBinding('items').filter();
			} else {
				_mdl.setProperty(_sp+'/Matnr',sKey);
				_mdl.setProperty(_sp+'/Ematn','');
				_mdl.setProperty(_sp+'/Maktx',sTxt);
				_mdl.setProperty(_sp+'/Matkl',sMatkl);
				_mdl.setProperty(_sp+'/MatklText',sMatklx);
				_mdl.setProperty(_sp+'/Meins',sM);
				if(!!sEkgrp) {
					_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
					_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
					_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
				}
				_mdl.setProperty(_sp+'/bEkgrpUseDef',sEkgrpDef);
				_mdl.setProperty(_sp+'/Ekgrp',sEkgrp);
				_mdl.setProperty(_sp+'/Eknam',sEknam);
				_mdl.setProperty(_sp+'/ProdRev',sRevlv);
				_mdl.setProperty(_sp+'/DrawRev',sZeivr);
				_mdl.setProperty(_sp+'/bHazmat',bHazmat);
				_mdl.setProperty(_sp+'/Curr', 'USD');

				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText('');	

				// _control.setValue('('+sKey+') '+sTxt);	
				// _control.setSelectedKey(sKey);
				if(!!_cb) _cb.getBinding('items').filter(new Filter("Matnr", FilterOperator.EQ, sKey))
			}

			// this.byId('itemMaterialSel').setSelectedText(sObj.Maktx);
		},

		onTextOnlySelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();
			let _self = this,
				_user = this.getUser();

			if(!_ctx) return;

			let _prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_head = _mdl.getProperty(_key+'/');


			let _selected = oEvent.getParameter('selected'),
				_sp = _ctx.sPath;

			let _matnr = _mdl.getProperty(_sp+'/Matnr');
			
			let _control = oEvent.oSource;

			if(!!_selected){
				if(!!_matnr) {
					_mdl.setProperty(_sp+'/Ematn',_matnr);
				}
				_mdl.setProperty(_sp+'/Matnr','');
				_mdl.setProperty(_sp+'/MatklText','');
				_mdl.setProperty(_sp+'/Matkl','');
				_mdl.setProperty(_sp+'/Meins', '');
				_mdl.setProperty(_sp+'/ProdRev','');								
				_mdl.setProperty(_sp+'/DrawRev','');								
				_mdl.setProperty(_sp+'/bHazmat',false);								
				_mdl.setProperty(_sp+'/Curr','USD');

			} else {
				_mdl.setProperty(_sp+'/Ematn','');
				_mdl.setProperty(_sp+'/Matnr','');
				_mdl.setProperty(_sp+'/MatklText','');
				_mdl.setProperty(_sp+'/Matkl','');
				_mdl.setProperty(_sp+'/Meins', '');
				_mdl.setProperty(_sp+'/ProdRev','');								
				_mdl.setProperty(_sp+'/DrawRev','');								
				_mdl.setProperty(_sp+'/bHazmat',false);								
				_mdl.setProperty(_sp+'/Curr','USD');
	
			}


		},

		onMatklItemSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();
			let _self = this;

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				sNew = !sRow,
			    sKey = (!!sObj)?sObj.MatGrp:_val,
				sTxt = (!!sObj)?sObj.Stext:_val;

			let _control = oEvent.oSource;

			if(!sKey) return;

			_mdl.setProperty(_sp+'/Matkl',sKey);
			_mdl.setProperty(_sp+'/MatklText',sTxt);

			_control.setValue('('+sKey+') '+sTxt);	

			if(!!_obj.bNewMaterial) {
				_self.getModel().callFunction("/updateTokenizer", {
					urlParameters : {trg:sKey,token:_obj.Maktx.split(' ').join(';'),type:'matkl'},
					success : function(oData, response) {
					},
					error : function(oError) {
					},
				});			
			}
			// this.byId('itemMaterialSel').setSelectedText(sObj.Maktx);
		},

		onItemTypeChange: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_sp =  _ctx.sPath,
				_mdl = _ctx.oModel,
				_sel = oEvent.getParameter('selectedItem').getBindingContext().getObject();

				let _cb = null;
				let _control = oEvent.oSource;
				if(_control.getId().includes('itemDetTypeSel')){
					_cb = this.getView().byId('itemDetUOMSel');
				} else {
					_cb = null;
				}

				_mdl.setProperty(_sp+'/Meins', _sel.Meins);
				_mdl.setProperty(_sp+'/ItemType', _sel.Icat);
				_mdl.setProperty(_sp+'/bMaterial', !_sel.bSrv);
				_mdl.setProperty(_sp+'/bNewMaterial', _sel.bSrv);
				_mdl.setProperty(_sp+'/bSoftware', _sel.bSW);

				if(_sel.bSrv){
					_mdl.setProperty(_sp+'/Matnr', '');
					_mdl.setProperty(_sp+'/Ematn', '');
				}
				_mdl.refresh(true);
	

				// let _mKey = _mdl.createKey('/itemCatSet',{
				// 	Icat: _sel.Icat
				// })

				// _mdl.read(_mKey,{
				// 	success: function(oData){
				// 		if(!!oData.Icat){
				// 			_mdl.setProperty(_sp+'/Meins', oData.Meins);
				// 			_mdl.setProperty(_sp+'/ItemType', oData.Icat);
				// 			_mdl.setProperty(_sp+'/bMaterial', !oData.bSrv);
				// 			_mdl.setProperty(_sp+'/bNewMaterial', oData.bSrv);
				// 			_mdl.setProperty(_sp+'/bSoftware', oData.bSW);
				// 			_mdl.refresh(true);
				// 		} else {
				// 			_mdl.setProperty(_sp+'/ItemType','');
				// 			_mdl.setProperty(_sp+'/Meins', '');
				// 			_mdl.setProperty(_sp+'/bNewMaterial', false);
				// 			_mdl.setProperty(_sp+'/bMaterial', true);
				// 			_mdl.setProperty(_sp+'/bSoftware', false);
				// 			_mdl.refresh(true);
				// 		}
				// 	},
				// 	error: function(oData){
				// 		_mdl.setProperty(_sp+'/ItemType','');
				// 		_mdl.setProperty(_sp+'/Meins', '');
				// 		_mdl.setProperty(_sp+'/bSoftware', false);
				// 		_mdl.setProperty(_sp+'/bMaterial', true);
				// 		_mdl.setProperty(_sp+'/bNewMaterial', false);
				// 		_mdl.refresh(true);
				// 	}
				// })	
		},

		onProductChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_head = _mdl.getProperty(_key+'/');
			
			let _cb = null;
			let _control = oEvent.oSource;
			if(_control.getId().includes('itemDetailProductSel')){
				_cb = this.getView().byId('itemDetUOMSel');
			} else if(_control.getId().includes('itemMaterialSel')) {
				_cb = _control.getParent().getCells().find((cc)=> {return cc.getId().includes('itemUOMSel')});
			} else {
				_cb = null;
			}


			let _mKey = _mdl.createKey('/ProductSet',{
				Matnr: _val,
				Werks: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.Matnr){
						_mdl.setProperty(_sp+'/Matnr',oData.Matnr);
						_mdl.setProperty(_sp+'/Maktx',oData.Maktx);
						_mdl.setProperty(_sp+'/Ematn','');
						_mdl.setProperty(_sp+'/Matkl',oData.Matkl);
						_mdl.setProperty(_sp+'/MatklText',oData.Matklx);
						_mdl.setProperty(_sp+'/Meins',oData.Meins);
						if(!!oData.Ekgrp) {
							_mdl.setProperty(_sp+'/Ekgrp',oData.Ekgrp);
							_mdl.setProperty(_sp+'/Eknam',oData.Eknam);
							_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
						}

						_mdl.setProperty(_sp+'/ProdRev',oData.Revlv);
						_mdl.setProperty(_sp+'/DrawRev',oData.Zeivr);
						_mdl.setProperty(_sp+'/bHazmat',oData.Hazmat);
		
						_mdl.setProperty(_sp+'/Curr','USD');
						// _self.byId('itemMaterialSel').setValue('('+oData.Matnr+') '+oData.Maktx);	
						// _self.byId('itemMaterialSel').setSelectedKey(oData.Matnr);
						// _control.setValue('('+oData.Matnr+') '+oData.Maktx);	
						_control.setSelectedKey(oData.Matnr);
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

						_mdl.setProperty(_sp+'/bNewMaterial',false);	

						if(!!_cb) _cb.getBinding('items').filter(new Filter("Matnr", FilterOperator.EQ, oData.Matnr))
					} else {
						// _control.setValue(_val);	
						// _self.byId('itemMaterialSel').setValue(_val);	
						_mdl.setProperty(_sp+'/Matnr',_val);						
						_mdl.setProperty(_sp+'/Ematn','');
						_mdl.setProperty(_sp+'/Maktx','');
						_mdl.setProperty(_sp+'/MatklText','');
						_mdl.setProperty(_sp+'/Matkl','');
						_mdl.setProperty(_sp+'/Meins', '');
						if(!_mdl.getProperty(_sp+'/Ekgrp')) {
							_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
							_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
							_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
						}
						// _mdl.setProperty(_sp+'/Ekgrp','');
						// _mdl.setProperty(_sp+'/Eknam','');								
						_mdl.setProperty(_sp+'/ProdRev','');								
						_mdl.setProperty(_sp+'/DrawRev','');								
						_mdl.setProperty(_sp+'/bHazmat',false);								
						_mdl.setProperty(_sp+'/Curr','USD');

						// _mdl.setProperty(_sp+'/bNewMaterial',true);
						// _control.setValueState(sap.ui.core.ValueState.Error);
						// _control.setValueStateText('Invalid COS Material ID');	

						// _mdl.setProperty(_sp+'/bNewMaterial',true);	
						if(!!_cb) _cb.getBinding('items').filter(new Filter("Matnr", FilterOperator.EQ, _val))
					}
				},
				error: function(oData){
					// _control.setValue(_val);
					// _self.byId('itemMaterialSel').setValue(_val);	
					_mdl.setProperty(_sp+'/Matnr',_val);
					_mdl.setProperty(_sp+'/Ematn','');
					_mdl.setProperty(_sp+'/Maktx','');
					_mdl.setProperty(_sp+'/Matkl','');
					_mdl.setProperty(_sp+'/MatklText','');
					_mdl.setProperty(_sp+'/Meins', '');
					if(!_mdl.getProperty(_sp+'/Ekgrp')) {
						_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
						_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
						_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
					}
					_mdl.setProperty(_sp+'/ProdRev','');	
					_mdl.setProperty(_sp+'/DrawRev','');	
					_mdl.setProperty(_sp+'/bHazmat',false);								
					_mdl.setProperty(_sp+'/Curr','USD');
					// _mdl.setProperty(_sp+'/bNewMaterial',true);
					if(!!_cb) _cb.getBinding('items').filter(new Filter("Matnr", FilterOperator.EQ, _val));
					// _self._purgeMessages();
					// _mdl.setProperty(_sp+'/bNewMaterial',true);
					// _control.setValueState(sap.ui.core.ValueState.Error);
					// _control.setValueStateText('Invalid COS Material ID');	


					// this.byId('itemMaterialSel').setValue(_val);
				}
			})

		},



		onMatklChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;
			

			let _control = oEvent.oSource;

			if(!!_val) {
				let _mKey = _mdl.createKey('/MatklSet',{
					MatGrp: _val
				})
	
				_mdl.read(_mKey,{
					success: function(oData){
						if(!!oData.MatGrp){
							_mdl.setProperty(_sp+'/Matkl',oData.MatGrp);
							_mdl.setProperty(_sp+'/MatklText',oData.Stext);
						} else {
							_control.setValue(_val);	
							_mdl.setProperty(_sp+'/Matkl','');
							_mdl.setProperty(_sp+'/MatklText','');
						}
	
						if(!!_prq.bNewMaterial) {
							_self.getModel().callFunction("/updateTokenizer", {
								urlParameters : {trg:oData.MatGrp,token:_prq.Maktx.split(' ').join(';'),type:'matkl'},
								success : function(oData, response) {
								},
								error : function(oError) {
								},
							});			
						}
			
					},
					error: function(oData){
						_control.setValue(_val);
						_mdl.setProperty(_sp+'/Matkl','');
						_mdl.setProperty(_sp+'/MatklText','');
					}
				})
	
			} else {
				_mdl.setProperty(_sp+'/Matkl','');
				_mdl.setProperty(_sp+'/MatklText','');
			}
		},

		onMaktxChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;
			

			let _control = oEvent.oSource;

			this._mapString(_val)
			.done(function(oData){
				if (!!oData && oData.length>0) {
					let _matkl = oData.sort((a,b) => b.score - a.score);

					let _mKey = _mdl.createKey('/MatklSet',{
						MatGrp: _matkl[0].trg
					})
		
					_mdl.read(_mKey,{
						success: function(oData){
							if(!!oData.MatGrp){
								_mdl.setProperty(_sp+'/Matkl',oData.MatGrp);
								_mdl.setProperty(_sp+'/MatklText',oData.Stext);
							} else {
								_mdl.setProperty(_sp+'/Matkl','');
								_mdl.setProperty(_sp+'/MatklText','');
							}
						},
						error: function(oData){
							_mdl.setProperty(_sp+'/Matkl','');
							_mdl.setProperty(_sp+'/MatklText','');
						}
					})
	
				}

	
				// _mdl.read(_mKey,{
				// 	success: function(oData){
				// 		if(!!oData.Matnr){
				// 			_mdl.setProperty(_sp+'/Matkl',oData.MatGrp);
				// 			_mdl.setProperty(_sp+'/MatklText',oData.Stext);
				// 		} else {
				// 			_control.setValue(_val);	
				// 			_mdl.setProperty(_sp+'/Matkl','');
				// 			_mdl.setProperty(_sp+'/MatklText','');
				// 		}
				// 	},
				// 	error: function(oData){
				// 		_control.setValue(_val);
				// 		_mdl.setProperty(_sp+'/Matkl','');
				// 		_mdl.setProperty(_sp+'/MatklText','');
				// 	}
				// })
	
			})

		},


		onInvApprSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				sNew = !sRow,
			    sKey = (!!sObj)?sObj.NTID:_val,
				sTxt = (!!sObj)?sObj.Gal:_val;

			let _control = oEvent.oSource;


			if(!sKey) return;

			let _mKey = _mdl.createKey('/EwpSet',{
				NTID: sKey
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.NTID){
						_mdl.setProperty(_sp+'/InvAppr',oData.NTID);
						_mdl.setProperty(_sp+'/InvApprName',oData.Gal);
						_mdl.setProperty(_sp+'/InvApprTel',oData.PrimaryPhone);
						_mdl.setProperty(_sp+'/InvApprEmail',oData.Email);
						_control.setValue(oData.Gal);	
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/InvApprName','');
						_mdl.setProperty(_sp+'/InvApprTel','');
						_mdl.setProperty(_sp+'/InvApprEmail', '');
						_mdl.setProperty(_sp+'/InvAppr','');
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Invoice Approver');	

					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/InvApprName','');
					_mdl.setProperty(_sp+'/InvApprTel','');
					_mdl.setProperty(_sp+'/InvApprEmail', '');
					_mdl.setProperty(_sp+'/InvAppr','');
					_control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Invoice Approver');	

				}
			})

		},

		onApproverSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				aUser = _mdl.getProperty(_sp+'/aUser'),
			    sKey = (!!sObj)?sObj.NTID:_val,
				sTxt = (!!sObj)?sObj.Gal:_val;

			let _control = oEvent.oSource;


			if(!sKey) return;

			if(aUser === sKey){
				return;
			} else {
				let _mKey = _mdl.createKey('/CCMgrSet',{
					NTID: sKey
				})
	
				_mdl.read(_mKey,{
					success: function(oData){
						if(!!oData.NTID){
							_mdl.setProperty(_sp+'/aUser',oData.NTID);
							_mdl.setProperty(_sp+'/aName',oData.Gal);
							_mdl.setProperty(_sp+'/aStatus','')
							_control.setValue('('+oData.NTID+') '+oData.Gal);	
							_control.setValueState(sap.ui.core.ValueState.None);
							_control.setValueStateText('');	
	
						} else {
							_mdl.setProperty(_sp+'/aUser','');
							_mdl.setProperty(_sp+'/aName','');
							_mdl.setProperty(_sp+'/aStatus','')
							_control.setValue(_val);	
							_control.setValueState(sap.ui.core.ValueState.Error);
							_control.setValueStateText('Invalid Approver');	
	
						}
					},
					error: function(oData){
						_mdl.setProperty(_sp+'/aUser','');
						_mdl.setProperty(_sp+'/aName','');
						_mdl.setProperty(_sp+'/aStatus','')
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Approver');	
	
					}
				})
	
			}


		},


		onSwitchDefEkgrp: function(oEvent){
			let _user = this.getUser();
			let _sel = oEvent.getParameter('selected');
			let _ctx = oEvent.oSource.getBindingContext();

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_sp = _ctx.sPath;

			let _hkey = _mdl.createKey('/HeaderSet',{
				PrqNo: _obj.PrqNo,
				Userid: _user.getId()
			})

			let _hdr = _mdl.getProperty(_hkey);

			if(_sel){
				_mdl.setProperty(_sp+'/Ekgrp',_hdr.PurchGrp);
				_mdl.setProperty(_sp+'/Eknam',_hdr.PurchGrpName);
			} else {
				_mdl.setProperty(_sp+'/Ekgrp','');
				_mdl.setProperty(_sp+'/Eknam','');
			}
			// _mdl.refresh(false);
		},

		onSwitchDefInvAppr: function(oEvent){
			let _sel = oEvent.getParameter('selected');
			let _ctx = oEvent.oSource.getBindingContext();
			let _user = this.getUser();

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_sp = _ctx.sPath;

			let _hkey = _mdl.createKey('/HeaderSet',{
				PrqNo: _obj.PrqNo,
				Userid: _user.getId()
			})

			let _hdr = _mdl.getProperty(_hkey);

			if(_sel){
				_mdl.setProperty(_sp+'/InvAppr',_hdr.Approver);
				_mdl.setProperty(_sp+'/InvApprName',_hdr.ApproverName);
				_mdl.setProperty(_sp+'/InvApprTel',_hdr.InvApprTel);
				_mdl.setProperty(_sp+'/InvApprEmail',_hdr.InvApprEmail);
			} else {
				_mdl.setProperty(_sp+'/InvAppr','');
				_mdl.setProperty(_sp+'/InvApprName','');
				_mdl.setProperty(_sp+'/InvApprTel','');
				_mdl.setProperty(_sp+'/InvApprEmail','');
				
			}
			// _mdl.refresh(false);
		},

		onAcknowledgeCompl: function(oEvent){
			let _sel = oEvent.getParameter('selected');
			let _ctx = oEvent.oSource.getBindingContext();
			let _user = this.getUser();

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_sp = _ctx.sPath;


			if(_sel){
				_mdl.setProperty(_sp+'/eSigBy',_user.getId());
				_mdl.setProperty(_sp+'/eSigName',_user.getFullName());
				_mdl.setProperty(_sp+'/eSigDate', new Date().toLocaleDateString());
				_mdl.setProperty(_sp+'/eSigTime', new Date().toLocaleTimeString('en-US', { hourCycle: 'h24' }));
			} else {
				_mdl.setProperty(_sp+'/eSigBy','');
				_mdl.setProperty(_sp+'/eSigName','');
				_mdl.setProperty(_sp+'/eSigDate', '');
				_mdl.setProperty(_sp+'/eSigTime', '');			
			}
			// _mdl.refresh(false);
		},

		displayTypeHint: function(oEvent){
			// let _pp = new sap.m.Popover({
			// 	title: 'Item Type',
			// 	placement: 'Bottom',
			// 	content: [
			// 		new sap.m.FormattedText({
			// 			htmlText:"{i18n>far45101}"
			// 		})
			// 	]
			// })

			// _pp.openBy(oEvent.oSource);
			sap.m.MessageBox.information("Select your item type. You can use this request to purchase Service, Equipment, Special tooling, Special test equipment or Real property. \n Please note that If the material purchased does not fall into one of this categories, the purchase must originate from SAP. \n As per FAR 45.101 definition, Material is a property that may be consumed or expended during the performance of a contract and/or​ component parts of a higher assembly and/or​ items that lose their individual identity through incorporation into an end-item. ");
		},
		onRecipientSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();

			if(!_ctx) return;

			let _obj = _ctx.getObject(),
				_mdl = _ctx.oModel,
				_val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				sNew = !sRow,
			    sKey = (!!sObj)?sObj.NTID:_val,
				sTxt = (!!sObj)?sObj.Gal:_val;

			let _control = oEvent.oSource;


			if(!sKey) return;

			let _mKey = _mdl.createKey('/EwpSet',{
				NTID: sKey
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.NTID){
						_mdl.setProperty(_sp+'/Recipient',oData.NTID);
						_mdl.setProperty(_sp+'/RecName',oData.Gal);
						_mdl.setProperty(_sp+'/RecTel',oData.PrimaryPhone);
						_mdl.setProperty(_sp+'/RecEmail',oData.Email);
						_control.setValue(oData.Gal);	
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/RecName','');
						_mdl.setProperty(_sp+'/RecTel','');
						_mdl.setProperty(_sp+'/RecEmail', '');
						_mdl.setProperty(_sp+'/Recipient','');
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Recipient');	

					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/RecName','');
					_mdl.setProperty(_sp+'/RecTel','');
					_mdl.setProperty(_sp+'/RecEmail', '');
					_mdl.setProperty(_sp+'/Recipient','');
					_control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Recipient');	

				}
			})

		},

		onInvApprChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;		

			let _control = oEvent.oSource;

			let _mKey = _mdl.createKey('/EwpSet',{
				NTID: _val
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.NTID){
						_mdl.setProperty(_sp+'/InvAppr',oData.NTID);
						_mdl.setProperty(_sp+'/InvApprName',oData.Gal);
						_mdl.setProperty(_sp+'/InvApprTel',oData.PrimaryPhone);
						_mdl.setProperty(_sp+'/InvApprEmail',oData.Email);
						_control.setValue(oData.Gal);	
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/InvApprName','');
						_mdl.setProperty(_sp+'/InvApprTel','');
						_mdl.setProperty(_sp+'/InvApprEmail', '');
						_mdl.setProperty(_sp+'/InvAppr','');
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Invoice Approver');	

					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/InvApprName','');
					_mdl.setProperty(_sp+'/InvApprTel','');
					_mdl.setProperty(_sp+'/InvApprEmail', '');
					_mdl.setProperty(_sp+'/InvAppr','');
					_control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Inv Approver');	

				}
			})

		},

		onApproverChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;		

			// let _control = oEvent.oSource;

			// let _mKey = _mdl.createKey('/CCMgrSet',{
			// 	NTID: _val
			// })

			// _mdl.read(_mKey,{
			// 	success: function(oData){
			// 		if(!!oData.NTID){
			// 			_mdl.setProperty(_sp+'/aUser',oData.NTID.slice(0,12).toUpperCase());
			// 			_mdl.setProperty(_sp+'/aName',oData.Gal.slice(0,29));
			// 			_mdl.setProperty(_sp+'/aStatus','')
			// 			_control.setValue('('+oData.NTID.slice(0,12).toUpperCase()+') '+oData.Gal.slice(0,29));	
			// 			_control.setValueState(sap.ui.core.ValueState.None);
			// 			_control.setValueStateText('');	

			// 		} else {
			// 			_mdl.setProperty(_sp+'/aUser','');
			// 			_mdl.setProperty(_sp+'/aName','');
			// 			_mdl.setProperty(_sp+'/aStatus','')
			// 			_control.setValue(_val);	
			// 			_control.setValueState(sap.ui.core.ValueState.Error);
			// 			_control.setValueStateText('Invalid Approver');	

			// 		}
			// 	},
			// 	error: function(oData){
			// 		_mdl.setProperty(_sp+'/aUser','');
			// 		_mdl.setProperty(_sp+'/aName','');
			// 		_mdl.setProperty(_sp+'/aStatus','')

			// 		_control.setValue(_val);	
			// 		_control.setValueState(sap.ui.core.ValueState.Error);
			// 		_control.setValueStateText('Invalid Approver');	

			// 	}
			// })

		},


		onRecValChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel;		

			let _control = oEvent.oSource;

			let _mKey = _mdl.createKey('/EwpSet',{
				NTID: _val
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.NTID){
						_mdl.setProperty(_sp+'/Recipient',oData.NTID);
						_mdl.setProperty(_sp+'/RecName',oData.Gal);
						_mdl.setProperty(_sp+'/RecTel',oData.PrimaryPhone);
						_mdl.setProperty(_sp+'/RecEmail',oData.Email);
						_control.setValue(oData.Gal);	
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/RecName','');
						_mdl.setProperty(_sp+'/RecTel','');
						_mdl.setProperty(_sp+'/RecEmail', '');
						_mdl.setProperty(_sp+'/Recipient','');
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Recipient');	

					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/RecName','');
					_mdl.setProperty(_sp+'/RecTel','');
					_mdl.setProperty(_sp+'/RecEmail', '');
					_mdl.setProperty(_sp+'/Recipient','');
					_control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Recipient');	

				}
			})

		},


		onCostChanged: function(oEvent){
			// let _ctx = oEvent.oSource.getBindingContext(),
			// 	_mdl = _ctx.oModel;
			let _ctx = oEvent.oSource.getBindingContext(),
			_sp = _ctx.sPath;

			
			this.getModel().setProperty(_sp+'/Curr','USD');

		},

		_purgeMessages: function(){
			let _rm=this._MessageManager.getMessageModel().getData().filter((ms) => {return(ms.code.indexOf("IWBEP")>0)})					
			this._MessageManager.removeMessages(_rm);
		},

		handleLoadItems: function(oEvent) {
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject();

			var aFilters = [];

			if(!_prq.bNewMaterial){
				aFilters.push(new Filter("Matnr", FilterOperator.EQ, _prq.Matnr));
				aFilters.push(new Filter("Icat", FilterOperator.EQ, _prq.ItemType));
			}
			
			oEvent.getSource().getBinding("items").resume();
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		handleLoadRevs: function(oEvent) {
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject();

			var aFilters = [];

			if(!_prq.bNewMaterial){
				aFilters.push(new Filter("Matnr", FilterOperator.EQ, _prq.Matnr));
			}
			
			oEvent.getSource().getBinding("items").resume();
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		handleLoadReviewList: function(oEvent) {
			let _user = this.getUser();

			var aFilters = [];

			aFilters.push(new Filter("Ntid", FilterOperator.EQ, _user.getId()));
			
			oEvent.getSource().getBinding("items").resume();
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		onMeinsChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_flt = [],
				_mdl = _ctx.oModel;



			if(_prq.bNewMaterial){

			} else {
				_flt.push(new Filter("Matnr", FilterOperator.EQ, _prq.Matnr));
				_flt.push(new Filter("Meins", FilterOperator.EQ, _val));
			}

			_mdl.read("/UOMSet",{
				filters: _flt,
				success: function(oData){
					let _data = [];
					if(oData.results.length>0) {
						_data = oData.results;
						if(_data.length<=0){
							_self.byId('itemUOMSel').setValueState(sap.ui.core.ValueState.Error);
							_self.byId('itemUOMSel').setValueStateText('Invalid UOM');	
						} else {
							let _rec = _data.find((rr) => { return rr.Meins===_val })
							if(!!_rec) {
								_mdl.setProperty(_sp+'/Meins',_rec.Meins);
								_self.byId('itemUOMSel').setSelectedKey(_rec.Meins);
								_self.byId('itemUOMSel').setValueState('None');
								_self.byId('itemUOMSel').setValueStateText('');
							} else {
								// _mdl.setProperty(_sp+'/Meins', '');
								_self.byId('itemUOMSel').setValueState(sap.ui.core.ValueState.Error);
								_self.byId('itemUOMSel').setValueStateText('Invalid UOM');	
							}
	
						}

					} else {
						// _mdl.setProperty(_sp+'/Meins', '');
						_self.byId('itemUOMSel').setValueState(sap.ui.core.ValueState.Error);
						_self.byId('itemUOMSel').setValueStateText('Invalid UOM');	
					}
				},
				error: function(oData){
					// _mdl.setProperty(_sp+'/Meins', '');
					_self.byId('itemUOMSel').setValueState(sap.ui.core.ValueState.Error);
					_self.byId('itemUOMSel').setValueStateText('Invalid UOM');
				}
			})

		},

		onP2PChange: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
			_self = this,
			_sp = _ctx.sPath,
			_val = oEvent.oSource.getState(),
			_mdl = _ctx.oModel;

			if(!!_val){
				_mdl.setProperty(_sp+'/appNotes','');
			}

		},

		onRevlvChanged: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_flt = [],
				_mdl = _ctx.oModel;



			if(_prq.bNewMaterial){

			} else {
				_flt.push(new Filter("Matnr", FilterOperator.EQ, _prq.Matnr));
				_flt.push(new Filter("Revlv", FilterOperator.EQ, _val));
			}

			_mdl.read("/RevSet",{
				filters: _flt,
				success: function(oData){
					let _data = [];
					if(oData.results.length>0) {
						_data = oData.results;
						if(_data.length<=0){
							_self.byId('itemRevSel').setValueState(sap.ui.core.ValueState.Error);
							_self.byId('itemRevSel').setValueStateText('Invalid Rev Level');	
						} else {
							let _rec = _data.find((rr) => { return rr.Revlv===_val })
							if(!!_rec) {
								_mdl.setProperty(_sp+'/Revlv',_rec.Revlv);
								_self.byId('itemRevSel').setSelectedKey(_rec.Revlv);
								_self.byId('itemRevSel').setValueState('None');
								_self.byId('itemRevSel').setValueStateText('');
							} else {
								// _mdl.setProperty(_sp+'/Meins', '');
								_self.byId('itemRevSel').setValueState(sap.ui.core.ValueState.Error);
								_self.byId('itemRevSel').setValueStateText('Invalid Rev Level');	
							}
	
						}

					} else {
						// _mdl.setProperty(_sp+'/Meins', '');
						_self.byId('itemRevSel').setValueState(sap.ui.core.ValueState.Error);
						_self.byId('itemRevSel').setValueStateText('Invalid Rev Level');	
					}
				},
				error: function(oData){
					// _mdl.setProperty(_sp+'/Meins', '');
					_self.byId('itemRevSel').setValueState(sap.ui.core.ValueState.Error);
					_self.byId('itemRevSel').setValueStateText('Invalid Rev Level');
				}
			})

		},


		onMeinsSuggest: function (oEvent) {
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject();

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Meins", FilterOperator.StartsWith, sTerm));
			}

			if(!_prq.bNewMaterial){
				aFilters.push(new Filter("Matnr", FilterOperator.EQ, _prq.Matnr));
			}
			
			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		closeDialog: function(oControl){
			if(oControl){
				oControl.close();
				oControl.destroy();				
				oControl = null;
			}
		},



		handleDlvDateChange: function(oEvent){
			
			let	_ctx = oEvent.oSource.getBindingContext(),
				_mdl = _ctx.oModel,
				_nVal = oEvent.getParameter('newValue'),
				_sp = _ctx.sPath;

			try {

				let _nv = (!!oEvent.getParameter('newValue'))?new Date(oEvent.getParameter('newValue')).YYYYMMDD():'';
				
				_mdl.setProperty(_sp+'/DlvDate',_nv);
				
			} catch (error) {
				_mdl.setProperty(_sp+'/DlvDate','');
			}

		},

		onImported: function (e) {
			var _data  = e.getParameter("Data");
			var _map  = e.getParameter("Map");
			var _control = e.oSource;
			var that = this;
			
			// var _localModel = new JSONModel();


			// var _importMap = [];
			var _mapComplete = false;

			if(_map){
				this._importExcel({data:_data,map:_map});
				e.oSource.close();
				// _importMap = _map;
				// _mapComplete = true;
			} else {
				_mapComplete = false;
				this._mapFromLayout(_data)
				.done(function(oMap){

					let _map = oMap.filter(el => el.score>0)

					// _importMap = oMap;
					// Temp Overwrite to disable user adjust mapping - Quentin Request 2/20
					if(_map.length>0) that._importExcel({data:_data,map:_map});
					if(_control) _control.close();
	
					// _control.mapImport(oMap);
				})
				
				// _mapComplete = _importMap.find(_m => _m.src.length === 0)?false:true;
			}
			
			// _localModel.setData({
			// 	items: _data
		   	// });			

			// if(_mapComplete) {
			// 	this._importExcel({data:_data,map:_importMap});
			// 	e.oSource.close();
			// } else {
			// 	e.oSource.mapImport(_importMap);				
			// }

		},

		_mapFromLayout: function(oData){
			let Self = this;
			let _data  = oData;
			let _promise = $.Deferred();
			// let _cc = Object.keys(_data[0]);
			let _ent = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(el => el.name==='Item');
			// let _acc = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(el => el.name==='ItemAcc');
			let _colMap = [];

			let _cc = [];

			_data.forEach((_row) => {
				let _a = Object.keys(_row);
				_cc.push(..._a);
				_cc=[...new Set(_cc)];
			})

			let _tmap = [];

			this.getModel().callFunction("/getTensor", {
				urlParameters : {trg:'', type: 'import'},  // Get All tensors
					success : function(oData, response) {
						if(oData.results) _tmap = oData.results;
						_ent.property.forEach( (el) => { 
							var _sem = el.extensions.find(ee => ee.name==='semantics');
							var _tt = (_sem)?_sem.value||'noimport':'noimport';
							var _ttkn = _tt.tokenArr();
			
							// let __c = _cols.find( (_e) => {
							// 	return (_e.getSortProperty().replace(/\s/g, '').toLowerCase() === el.name.replace(/\s/g, '').toLowerCase())
							// });
							// let __cv = (__c)?(__c.getVisible()||__c.getName().replace(/\s/g, '').toLowerCase() ==='order'):false;
			
							// let _import = (_tt==='noimport'?false:__cv);
							let _import = (_tt==='noimport'?false:true);
			
							if(_import){
								var _scc = _cc.map((_src)=>{
									let _smap = _src.tokenArr().map((_tk)=>{
										let _match = (_src.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase());
										let _score = 0;
										if(_match){
											_score = 4;
										} 
										// Temp Change to only consider Hard Match, not CP
										// else {
										// 	_score = _ttkn.includes(_tk)?2:0;
										// }
										let _elem = {id:_src, token:_tk, score:_score};

										// Temp Change to ignore user selected substitutions
										// if(_tmap.length>0){
										// 	let _tm = _tmap.find((ee) => {
										// 		return (ee.Token.toLowerCase()===_tk.toLowerCase() && ee.Trg.toLowerCase()===el.name.toLowerCase());
										// 	})
										// 	if(!!_tm) _elem.score += _tm.Score;
										// }
										return _elem;
								   })
			
									let score = _smap.reduce((accumulator, item) => {
										return accumulator + item.score;
									}, 0)
			
									return({src:_src,score:score});
			
								});
			
								_scc.sort((a,b) => b.score - a.score);
			
								var pp = _cc.find( (_e) => {
									let _match = (_e.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase());
									if(_match) {
										return true;
									} else {
										return (_scc[0].score>0)?(_e.toLowerCase() === _scc[0].src.toLowerCase()):false;
									}
			
								// 	let _trgmap = _e.tokenArr().map((_tk)=>{
								// 		let _elem = {trg:el.name, token:_tk, score:(_ttkn.includes(_tk)?3:1)};
								// 		return _elem;
								//    })
				   
								// 	// return (_e.replace(/\s/g, '').toLowerCase() === el.name.replace(/\s/g, '').toLowerCase())
								// 	return (_e.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase())
								}); 
			
								let _sccr = (!!pp)?_scc.find( (_e) => { return _e.src===pp }):{score:0};
			
								_colMap.push({
									// 'trg': el.name,
									'trg': el.name,
									'trgName': _tt,
									'src': (pp)?pp:'',
									'score':_sccr.score
								})	
							}
						})	
		
						_promise.resolve(_colMap);
					},
					error : function(oError) {
						_promise.reject(oError);
					},
			});			


			return _promise;

		},

		_mapString: function(s){
			let _self = this;
			let _promise = $.Deferred();
			let _cc = [s];
			// let _ent = [];
			// let _acc = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(el => el.name==='ItemAcc');
			let _colMap = [];

			let _tmap = [];

			let _filters = s.tokenArr().map((_t) => {
				return new Filter("Stext", FilterOperator.Contains, _t)
			})



			var singularize = function(word) {
				const endings = {
					ves: 'fe',
					ies: 'y',
					i: 'us',
					zes: 'ze',
					ses: 's',
					es: 'e',
					en: '',
					s: ''
				};
				return word.replace(
					new RegExp(`(${Object.keys(endings).join('|')})$`), 
					r => endings[r]
				);
			}


			this.getModel().read('/MatklSet',{
				filters: _filters,
				success: function(oData){
					let _ent = oData.results;
					let _ca = _cc[0].split(' ');

					_self.getModel().callFunction("/getTensors", {
						urlParameters : {tokenString:_ca.join('#'),type:'matkl'},  // Get All tensors
							success : function(oData, response) {
								if(oData.results) _tmap = oData.results;
								_ent.forEach( (el) => { 
									let _trg = el.MatGrp;
									var _tt = el.Stext;
									var _st = singularize(_tt);
									var _ttkn = _tt.tokenArr();
									_st.tokenArr().forEach((t) => {
										_ttkn.push(t)
									})
									_ttkn.push(el.MatGrp);
									_ttkn = [...new Set(_ttkn)];
					
									var _scc = _cc.map((_src)=>{
										let _smap = _src.tokenArr().map((_tk)=>{
											let _sForm = singularize(_tk);
											let _match = (_src.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase());
											let _score = 0;
											if(_match){
												_score = 4;
											} else {
												_score = (_ttkn.includes(_tk) || _ttkn.includes(_sForm))?2:0;
											}
											let _elem = {id:_src, token:_tk, score:_score};
											if(_tmap.length>0){
												let _tm = _tmap.find((ee) => {
													return ( (ee.Token.toLowerCase()===_tk.toLowerCase() || ee.Token.toLowerCase()===_sForm.toLowerCase() ) && ee.Trg.toLowerCase()===el.MatGrp.toLowerCase() );
												})
												if(!!_tm) _elem.score += _tm.Score;
											}
											return _elem;
										})

										
										let score = _smap.reduce((accumulator, item) => {
											return accumulator + item.score;
										}, 0)
				
										return({src:_src,score:score});
				
									});
				
									_scc.sort((a,b) => b.score - a.score);
				
									var pp = _cc.find( (_e) => {
										let _match = (_e.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase());
										if(_match) {
											return true;
										} else {
											return (_scc[0].score>0)?(_e.toLowerCase() === _scc[0].src.toLowerCase()):false;
										}
				
									// 	let _trgmap = _e.tokenArr().map((_tk)=>{
									// 		let _elem = {trg:el.name, token:_tk, score:(_ttkn.includes(_tk)?3:1)};
									// 		return _elem;
									//    })
						
									// 	// return (_e.replace(/\s/g, '').toLowerCase() === el.name.replace(/\s/g, '').toLowerCase())
									// 	return (_e.replace(/\s/g, '').toLowerCase() === _tt.replace(/\s/g, '').toLowerCase())
									}); 
				
									let _sccr = (!!pp)?_scc.find( (_e) => { return _e.src===pp }):{score:0};
				
									_colMap.push({
										// 'trg': el.name,
										'trg': el.MatGrp,
										'trgName': _tt,
										'src': (pp)?pp:'',
										'score':_sccr.score
									})	
								})	
				
								_promise.resolve(_colMap);
							},
							error : function(oError) {
								_promise.reject(oError);
							},
					});			
		

				}
			})




			return _promise;

		},


		_importExcel:function(param){
			// return false;
			var _param = param || {};
			var _data = _param.data || [];
			var _map = _param.map || [];
			var _pendingUpdates = [];
			var _self = this;
			let _head = this.getView().getBindingContext().getObject();
			let _user = this.getUser();
			let _cTab = this.getView().byId('lineItemsList');
			let oItemsBinding = _cTab.getBinding("rows");
			let _nextItem = 0;
			let tACat = [];
			let tICat = [];
			let _mdl = this.getModel();

			this.getModel().read('/itemCatSet',{
				success: function(oData){
					tICat = oData.results;
				},
				error: function(oData){
					tICat = [];
				}
			});

			var padWithLeadingZeros=function(num, totalLength) {
				return String(num).padStart(totalLength, '0');
			}

			var _parseMatnr = function(oItem) {

				return new Promise(function (resolve, reject) { 

					if(!!oItem.bNewMaterial){
						oItem.Ematn = oItem.Matnr;
						oItem.Matnr = '';
						resolve(true);
					} else {
						if(!!oItem.Matnr) {
							let _mKey = _mdl.createKey('/ProductSet',{
								Matnr: oItem.Matnr,
								Werks: _head.Plant
							})
				
							_mdl.read(_mKey,{
								success: function(oData){
									let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
										_sp = _itm.sPath;
			
									if(!!oData.Matnr){
										_mdl.setProperty(_sp+'/Matnr',oData.Matnr);
										_mdl.setProperty(_sp+'/Maktx',oData.Maktx);
										_mdl.setProperty(_sp+'/Matkl',oData.Matkl);
										_mdl.setProperty(_sp+'/MatklText',oData.Matklx);
										_mdl.setProperty(_sp+'/Meins',oData.Meins);
				
										if(!!oData.Ekgrp) {
											_mdl.setProperty(_sp+'/Ekgrp',oData.Ekgrp);
											_mdl.setProperty(_sp+'/Eknam',oData.Eknam);
											_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
										}
			
										_mdl.setProperty(_sp+'/ProdRev',oData.Revlv);
										_mdl.setProperty(_sp+'/DrawRev',oData.Zeivr);
										_mdl.setProperty(_sp+'/bHazmat',oData.Hazmat);
			
										_mdl.setProperty(_sp+'/bNewMaterial',false);	
			
									} else {
										_mdl.setProperty(_sp+'/Matnr',oItem.Matnr);
										_mdl.setProperty(_sp+'/Ematn','');
									}
									resolve(oData);

								},
								error: function(oData){
									let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
									_sp = _itm.sPath;
		
									_mdl.setProperty(_sp+'/Matnr',oItem.Matnr);
									_mdl.setProperty(_sp+'/Ematn','');
									reject(oData);
								}
							})
			
						}
		
					}
	

					// resolve(_self.parseAttContent(oContext,oData));
				})


			};

			var _parseMatkl = function(oItem) {
				if (!!oItem.Matkl && oItem.Matkl.length<=9) {

					let _mKey = _mdl.createKey('/MatklSet',{
						MatGrp: oItem.Matkl
					})
		
					_mdl.read(_mKey,{
						success: function(oData){
							let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
							_sp = _itm.sPath;
			
							if(!!oData.MatGrp){
								_mdl.setProperty(_sp+'/MatklText',oData.Stext);
							}
						},
						error: function(oData){
							// _mdl.setProperty(_sp+'/Matkl','');
						}
					})
	
				}
			};

			var _parseWBS = function(oItem) {
				if (!!oItem.WBS && oItem.WBS.length===12) {

					let _mKey = _mdl.createKey('/ChargeCodeSet',{
						ZlFrom: oItem.WBS,
						ZlSite: _head.Plant
					})
		
					_mdl.read(_mKey,{
						success: function(oData){
							let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
							_sp = _itm.sPath;
			
							if(!!oData.ZlFrom){
								_mdl.setProperty(_sp+'/WBS',oData.ZlFrom);
								_mdl.setProperty(_sp+'/WBStext',oData.ZlDesc);
								_mdl.setProperty(_sp+'/Contract',oData.ZlPrimCont);		
							}
						},
						error: function(oData){
						}
					})
	
				}
			};

			var _parseCC = function(oItem) {
				if (!!oItem.CostCenter) {

					let _mKey = _mdl.createKey('/CostCenterSet',{
						ZlFrom: oItem.CostCenter,
						ZlSite: _head.Plant
					})
		
					_mdl.read(_mKey,{
						success: function(oData){
							let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
							_sp = _itm.sPath;
			
							if(!!oData.ZlFrom){
								_mdl.setProperty(_sp+'/CostCenter',oData.ZlFrom);
								_mdl.setProperty(_sp+'/CCtext',oData.ZlDesc);		
							}
						},
						error: function(oData){
						}
					})
	
				}
			};

			var _parseGL = function(oItem) {
				let isnum = /^\d+$/.test(oItem.GLAcc);

				if (!!oItem.GLAcc && !!isnum) {


					let _mKey = _mdl.createKey('/GLAccSet',{
						ZlFrom: oItem.GLAcc,
						ZlSite: _head.Plant
					})
		
					_mdl.read(_mKey,{
						success: function(oData){
							let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
							_sp = _itm.sPath;
			
							if(!!oData.ZlFrom){
								// _mdl.setProperty(_sp+'/GLAcc',oData.ZlFrom);
								_mdl.setProperty(_sp+'/GLtext',oData.ZlDesc);
							}
						},
						error: function(oData){
						}
					})
	
				}
			};

			var _parseItemType = function(oItem) {

				oItem.ItemType = (!!oItem.ItemType)?oItem.ItemType:'P';

				oItem.Curr = 'USD';

				let _iCat = tICat.find((el)=>{
					return el.Icat === oItem.ItemType;
				});

				if(_iCat){
					oItem.bMaterial = _iCat.bSrv;
					oItem.bSoftware = _iCat.bSW;
					oItem.bMaterial = !_iCat.bSrv;
					if(!oItem.Meins) oItem.Meins = (!!_iCat)?_iCat.Meins:'EA';

					if(!oItem.bNewMaterial) {
						oItem.bNewMaterial = (!oItem.Matnr || _iCat.bSrv);
					}
				}
			};

			var _parseTag = function(oItem){
				let _tag = '';
				switch(oItem.Tag) {
					case 'Y': _tag = 'X'; break;
					case 'N': _tag = '-'; break;
					default: '';
				}
				oItem.Tag = _tag;
			}

			var _parseMinBuy = function(oItem){
				let _minBuy = '';
				switch(oItem.MinBuy) {
					case 'Y': _minBuy = 'X'; break;
					case 'N': _minBuy = '-'; break;
					default: '';
				}
				oItem.MinBuy = _minBuy;
			}

			var _parseDlvDate = function(oItem){
				if(!!oItem.DlvDate) oItem.DlvDate = new Date(oItem.DlvDate).YYYYMMDD()
			}

			var _parseEkgrp = function(oItem){
				if(!!oItem.bEkgrpUseDef) {					
					oItem.Ekgrp = _head.PurchGrp;
					oItem.Eknam = _head.PurchGrpName;	
				} else {

					if(!oItem.Ekgrp) {
						if(!!_head.PurchGrp){
							oItem.bEkgrpUseDef = true;
							oItem.Ekgrp = _head.PurchGrp;	
							oItem.Eknam = _head.PurchGrpName;	
						}
					} else {
						// if(!oItem.bEkgrpUseDef){
							let _mKey = _mdl.createKey('/PGroupSet',{
								Ekgrp: oItem.Ekgrp
							})
				
							_mdl.read(_mKey,{
								success: function(oData){
									let _itm = _cTab.getBinding('rows').getContexts().find((cc) => { return cc.getObject().PrqItem===oItem.PrqItem}),
									_sp = _itm.sPath;
		
									if(!!oData.Ekgrp){
										_mdl.setProperty(_sp+'/Ekgrp',oData.Ekgrp);
										_mdl.setProperty(_sp+'/Eknam',oData.Eknam);
										_mdl.setProperty(_sp+'/bEkgrpUseDef',false);
									} else {
										if(!!_head.PurchGrp){
											_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
											_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
											_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
										} else {
											_mdl.setProperty(_sp+'/Ekgrp','');
											_mdl.setProperty(_sp+'/Eknam','');
											_mdl.setProperty(_sp+'/bEkgrpUseDef',false);											
										}		
									}
								},
				
								error: function(oData){
									if(!!_head.PurchGrp){
										_mdl.setProperty(_sp+'/Ekgrp',_head.PurchGrp);
										_mdl.setProperty(_sp+'/Eknam',_head.PurchGrpName);
										_mdl.setProperty(_sp+'/bEkgrpUseDef',true);
									} else {
										_mdl.setProperty(_sp+'/Ekgrp','');
										_mdl.setProperty(_sp+'/Eknam','');
										_mdl.setProperty(_sp+'/bEkgrpUseDef',false);											
									}		
								}
							})	
						// }
			
					}
	
				}



			}



			var _parseAccCat = function(oItem) {

				let _aCat = tACat.find((el)=>{
					return el.Category === oItem.Category;
				});

				oItem.bSplit = false;

				if(_aCat){
					oItem.bWBS = (!!_aCat)?_aCat.bWBS:false,
					oItem.bCC = (!!_aCat)?_aCat.bCC:false,
					oItem.bGL = (!!_aCat)?_aCat.bGL:false;
				}

				if(!oItem.bWBS) oItem.WBS='';
				if(!oItem.bCC) 	oItem.CostCenter='';
				if(!oItem.bGL) 	oItem.GLAcc='';

				oItem.bApprove = (!!_aCat)?_aCat.bApprove:false;				

			};

			var f_import = function(oItem,oPromise){

				_cTab.getBinding('rows').getContexts().forEach((rr) => {
					_nextItem = Math.max(_nextItem,parseInt(rr.getObject().PrqItem))
				})
				
				oItem.PrqItem = padWithLeadingZeros(_nextItem+1, 3);

				oItem.Curr = 'USD';
				
				_parseMinBuy(oItem);

				_parseTag(oItem);

				_parseItemType(oItem);

				_parseMatnr(oItem)
				.then(function(oData){
					_parseEkgrp(oItem);
					_parseMatkl(oItem);
				})
				
				_parseAccCat(oItem);
			
				_parseWBS(oItem);

				_parseCC(oItem);				

				_parseGL(oItem);

				_parseDlvDate(oItem);

				// _parseMatnr(oItem);

				oItem.bEditable = true;
				

				oItemsBinding.create(oItem, true, {inactive : false});

			};


			this.getModel().read('/ACatSet',{
				success: function(oData){
					tACat = oData.results;
					if(_data) {
						var _ent = _self.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(el => el.name==='Item');
						// var _acc = this.getView().getModel().getServiceMetadata().dataServices.schema[0].entityType.find(el => el.name==='ItemAcc');
		
						var _fmap = _map.filter( el => el.src.length>0);
		
						let aTokens=[];
						// _fmap.forEach((rr) => {
						// 	// self.genSHA256Hash(rr.trg).then(function(hashToken){
						// 		_self.getModel().callFunction("/updateTokenizer", {
						// 			urlParameters : {trg:rr.trg,token:rr.src.tokenize(),type:'import'},
						// 			success : function(oData, response) {
						// 			},
						// 			error : function(oError) {
						// 			},
						// 		});			
						// 	// })
						// 	// aTokens[_r] = _self._tokenize(rr)
						// })
			
						_data.forEach(function (item) {
							var newLocalObject = {};
							var _promise = $.Deferred();
		
							_fmap.forEach( (el) => { 
								var _d = _ent.property.find( p => p.name===el.trg);
								// var _a = _acc.property.find( p => p.name===el.trg);
								if(!!_d){
									switch(_d.type){
										case 'Edm.String': 
											let _s1 = (item[el.src])?String(item[el.src]).trim():'';
											if(_s1.length > _d.maxLength) _s1 = '';
											newLocalObject[el.trg] = _s1; break;
										case 'Edm.Boolean': 
											let __s = (item[el.src])?String(item[el.src]).toLowerCase().replace('n','').replace('y','X'):'';
											newLocalObject[el.trg] = (__s==='X')?true:false;
											break;
										case 'Edm.Decimal': 
											let __p = (_d.scale>0)?_d.scale-1:0;
											let __n = (item[el.src])?item[el.src].replace(/[^\d.-]/g, ''):(0).toFixed(__p);
											newLocalObject[el.trg] = (__n)?parseFloat(__n).toFixed(__p):'0'; break;
										case 'Edm.DateTime': 
											let _dt = (item[el.src])?new Date(item[el.src]):new Date('12/31/9999');
											newLocalObject[el.trg] = isNaN(_dt)?new Date('12/31/9999').YYYYMMDD():_dt.YYYYMMDD();								
											break;
										case 'Edm.Int16': 
										case 'Edm.Int32': 
										case 'Edm.Int64': newLocalObject[el.trg] = (item[el.src])?parseInt(item[el.src]).toFixed(0):'0'; break;
										default: 
											let _s2 = (item[el.src])?String(item[el.src]).trim():'';
											if(_s2.length > _d.maxLength) _s2 = '';
											newLocalObject[el.trg] = _s2; break;
									}
			
								}
		
							});
		
		
				
							if((!!newLocalObject.Matnr || !!newLocalObject.Maktx) && newLocalObject.Menge > 0) {
								newLocalObject.PrqNo = _head.PrqNo;
								newLocalObject.CName = _user.getId();
								f_import(newLocalObject,_promise);
								// _pendingUpdates.push(f_import(newLocalObject,_promise));
							}
							
						});
		
						// $.when.apply($, _pendingUpdates).then(function () {
		
						// 	_self.getView().getModel().refresh(true);
		
						// })
		
					}
		
				},
				error: function(oData){

				}
			})





		},

		_tokenize: function(s){
			let filters = ['a','the','this', 'is','was','be','what','which','there','where','that','and','or','when','then','than'];

			let _tkn =  [... new Set(s.split(/\W+/).filter(function(token) {
				return token.length > 2 && filters.indexOf(token) == -1;
			  }))].join(';')

			return _tkn;
		},

		onAccCategoryChange: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_sp =  _ctx.sPath,
				_mdl = _ctx.oModel,
				_sel = oEvent.getParameter('selectedItem').getBindingContext().getObject();

				_mdl.setProperty(_sp+'/Category', _sel.Category);
				_mdl.setProperty(_sp+'/bWBS', _sel.bWBS);
				_mdl.setProperty(_sp+'/bCC', _sel.bCC);
				_mdl.setProperty(_sp+'/bGLAcc', _sel.bGLAcc);
				_mdl.setProperty(_sp+'/bInspect', _sel.bInspect);
				_mdl.setProperty(_sp+'/bOrder', _sel.bOrder);
				_mdl.setProperty(_sp+'/bApprove', _sel.bApprove);
				_mdl.setProperty(_sp+'/bCC', _sel.bCC);
				_mdl.setProperty(_sp+'/bSplit', false);

				_mdl.setProperty(_sp+'/WBS', '');
				_mdl.setProperty(_sp+'/WBStext', '');
				_mdl.setProperty(_sp+'/CostCenter', '');
				_mdl.setProperty(_sp+'/CCtext', '');
				_mdl.setProperty(_sp+'/GLAcc', '');
				_mdl.setProperty(_sp+'/GLtext', '');
				_mdl.setProperty(_sp+'/aUser', '');
				_mdl.setProperty(_sp+'/aName', '');
				_mdl.setProperty(_sp+'/aDate', '');
				_mdl.setProperty(_sp+'/aTime', '');
				_mdl.setProperty(_sp+'/AContract', '');

				_mdl.refresh(true);

		},

		onAccWBSSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("ZlDesc", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("ZlSite", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onChargeNumSuggest: function (oEvent) {
			let _mdl = oEvent.oSource.getModel(),
				_prq = oEvent.oSource.getModel('mHdr').oData,
				_pl = _prq.Plant;

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("ZlDesc", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("ZlSite", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onGenChargeNumSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("ZlDesc", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("ZlSite", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},


		onAccCCSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');


			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("ZlDesc", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("ZlSite", FilterOperator.EQ, _pl));
			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onAccGLSuggest: function (oEvent) {
			let _user = this.getUser();
			let _mdl = oEvent.oSource.getBindingContext().oModel,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_wbs = _prq.WBS,
				_bwbs = _prq.bWBS,
				_bcc = _prq.bCC,
				_cc = _prq.CostCenter,
				_pl = _mdl.getProperty(_key+'/Plant');

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("ZlDesc", FilterOperator.StartsWith, sTerm));
				aFilters.push(new Filter("ZlSite", FilterOperator.EQ, _pl));
				aFilters.push(new Filter("WBS", FilterOperator.EQ, _wbs));
				aFilters.push(new Filter("bWBS", FilterOperator.EQ, _bwbs));
				aFilters.push(new Filter("CC", FilterOperator.EQ, _cc));
				aFilters.push(new Filter("bCC", FilterOperator.EQ, _bcc));
						// 		new sap.ui.model.Filter("WBS", sap.ui.model.FilterOperator.EQ, oData.ZlFrom),
						// 		new sap.ui.model.Filter("bWBS", sap.ui.model.FilterOperator.EQ, true),
						// 		new sap.ui.model.Filter("bCC", sap.ui.model.FilterOperator.EQ, false),

			}

			oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
		},

		onAccWBSChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue().toUpperCase(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_control = oEvent.oSource;



			let _mKey = _mdl.createKey('/ChargeCodeSet',{
				ZlFrom: _val,
				ZlSite: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.ZlFrom){
						_mdl.setProperty(_sp+'/WBS',oData.ZlFrom);
						_mdl.setProperty(_sp+'/WBStext',oData.ZlDesc);
						_mdl.setProperty(_sp+'/Contract',oData.ZlPrimCont);
						_self.byId('itemAccWBSSel').setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
						_self.byId('itemAccWBSSel').setSelectedKey(oData.ZlFrom);
						if(!oData.bInsp) {
							_control.setValueState(sap.ui.core.ValueState.Error);
							_control.setValueStateText('Only non-Inspectable WBS allowed');	
						} else {
							_control.setValueState(sap.ui.core.ValueState.None);
							_control.setValueStateText('');	
						}

						// _glSel.bindSuggestionRows({
						// 	path: '/GLAccSet',
						// 	template: _glTpl,
						// 	filters: [
						// 		new sap.ui.model.Filter("WBS", sap.ui.model.FilterOperator.EQ, oData.ZlFrom),
						// 		new sap.ui.model.Filter("bWBS", sap.ui.model.FilterOperator.EQ, true),
						// 		new sap.ui.model.Filter("bCC", sap.ui.model.FilterOperator.EQ, false),
						// 	]
						// })
					} else {
						_mdl.setProperty(_sp+'/WBS','');
						_mdl.setProperty(_sp+'/WBStext', _val);
						_mdl.setProperty(_sp+'/Contract','');
						_self.byId('itemAccWBSSel').setValue('');	
						// _glSel.unbindSuggestionRows();

					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/WBS','');
					_mdl.setProperty(_sp+'/WBStext',_val);
					_mdl.setProperty(_sp+'/Contract','');
					_self.byId('itemAccWBSSel').setValue('');	
					// _glSel.unbindSuggestionRows();
				}
			})

		},

		onChargeCodeChanged: function(oEvent){
			let _val = oEvent.oSource.getValue(),
				_mdl = oEvent.oSource.getModel(),
				_mHdr = oEvent.oSource.getModel('mHdr'),
				_prq = _mHdr.oData,
				_pl = _prq.Plant,
				_control = oEvent.oSource;


			let _mKey = _mdl.createKey('/ChargeCodeSet',{
				ZlFrom: _val,
				ZlSite: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.ZlFrom){
						_mHdr.setProperty('/ChargeNum',oData.ZlFrom);
						_mHdr.setProperty('/ChargeNumTxt',oData.ZlDesc);
						_control.setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
						_control.setSelectedKey(oData.ZlFrom);
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mHdr.setProperty('/ChargeNum','');
						_mHdr.setProperty('/ChargeNumTxt', _val);
						_control.setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Charge Code');	

					}
				},
				error: function(oData){
					_mHdr.setProperty('/ChargeNum','');
					_mHdr.setProperty('/ChargeNumTxt', _val);
					_control.setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Charge Code');	
			}
			})

		},

		onLiveChangeToUppercase: function(oEvent) {
			var oInput = oEvent.getSource();
			var sValue = oEvent.getParameter("value").toUpperCase();
			oInput.setValue(sValue);
		},

		// onGenChargeCodeChanged: function(oEvent){
		// 	let _ctx = oEvent.oSource.getBindingContext(),
		// 		_sp = _ctx.sPath,
		// 		_val = oEvent.oSource.getValue(),
		// 		_prq = oEvent.oSource.getBindingContext().getObject(),
		// 		_mdl = _ctx.oModel,			
		// 		_pl = _prq.Plant,
		// 		_control = oEvent.oSource;


		// 	let _mKey = _mdl.createKey('/LaborCodeSet',{
		// 		ZlFrom: _val,
		// 		ZlSite: _pl
		// 	})

		// 	_mdl.read(_mKey,{
		// 		success: function(oData){
		// 			if(!!oData.ZlFrom){
		// 				_mdl.setProperty(_sp+'/ChargeNum',oData.ZlFrom);
		// 				_mdl.setProperty(_sp+'/ChargeNumTxt',oData.ZlDesc);
		// 				_control.setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
		// 				_control.setSelectedKey(oData.ZlFrom);
		// 				_control.setValueState(sap.ui.core.ValueState.None);
		// 				_control.setValueStateText('');	
		// 			} else {
		// 				_mdl.setProperty(_sp+'/ChargeNum','');
		// 				_mdl.setProperty(_sp+'/ChargeNumTxt', oData.ZlDesc);
		// 				_control.setValue(_val);	
		// 				_control.setValueState(sap.ui.core.ValueState.Error);
		// 				_control.setValueStateText('Invalid Charge Code');	


		// 			}
		// 		},
		// 		error: function(oData){
		// 			// _mdl.setProperty(_sp+'/ChargeNum','');
		// 			// _mdl.setProperty(_sp+'/ChargeNumTxt', _val);
		// 			// _control.setValue(_val);	
		// 			_control.setValueState(sap.ui.core.ValueState.Error);
		// 			_control.setValueStateText('Invalid Charge Code');	

		// 		}
		// 	})

		// },

		onAccCCChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue().toUpperCase(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				_glSel = _self.byId('itemAccGLSel'),
				_control = oEvent.oSource,
				_glTpl = _glSel.getBindingInfo('suggestionRows').template;



			let _mKey = _mdl.createKey('/CostCenterSet',{
				ZlFrom: _val,
				ZlSite: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.ZlFrom){
						_mdl.setProperty(_sp+'/CostCenter',oData.ZlFrom);
						_mdl.setProperty(_sp+'/CCtext',oData.ZlDesc);
						_self.byId('itemAccCCSel').setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
						_self.byId('itemAccCCSel').setSelectedKey(oData.ZlFrom);
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

						// _glSel.bindSuggestionRows({
						// 	path: '/GLAccSet',
						// 	template: _glTpl,
						// 	filters: [
						// 		new sap.ui.model.Filter("CC", sap.ui.model.FilterOperator.EQ, oData.ZlFrom),
						// 		new sap.ui.model.Filter("bWBS", sap.ui.model.FilterOperator.EQ, false),
						// 		new sap.ui.model.Filter("bCC", sap.ui.model.FilterOperator.EQ, true),
						// 	]
						// })
						_mdl.refresh(true);


					} else {
						_mdl.setProperty(_sp+'/CostCenter','');
						_mdl.setProperty(_sp+'/CCtext', _val);
						_self.byId('itemAccCCSel').setValue(_Val);	
						// _glSel.bindSuggestionRows({
						// 	path: '/GLAccSet',
						// 	template: _glTpl,
						// 	filters: [
						// 		new sap.ui.model.Filter("CC", sap.ui.model.FilterOperator.EQ, oData.ZlFrom),
						// 		new sap.ui.model.Filter("bWBS", sap.ui.model.FilterOperator.EQ, false),
						// 		new sap.ui.model.Filter("bCC", sap.ui.model.FilterOperator.EQ, true),
						// 	]
						// })
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Cost Center');	

						_mdl.refresh(true);
					}
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/CostCenter','');
					_mdl.setProperty(_sp+'/CCtext',_val);
					_self.byId('itemAccCCSel').setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid Cost Center');	

					// _glSel.bindSuggestionRows({
					// 	path: '/GLAccSet',
					// 	template: _glTpl,
					// 	filters: [
					// 		new sap.ui.model.Filter("CC", sap.ui.model.FilterOperator.EQ, oData.ZlFrom),
					// 		new sap.ui.model.Filter("bWBS", sap.ui.model.FilterOperator.EQ, false),
					// 		new sap.ui.model.Filter("bCC", sap.ui.model.FilterOperator.EQ, true),
					// 	]
					// })

					_mdl.refresh(true);
				}
			})

		},

		onAccGLChanged: function(oEvent){
			let _user = this.getUser();
			let _ctx = oEvent.oSource.getBindingContext(),
				_self = this,
				_sp = _ctx.sPath,
				_val = oEvent.oSource.getValue().toUpperCase(),
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_mdl = _ctx.oModel,
				_control = oEvent.oSource,
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant');


			let _mKey = _mdl.createKey('/GLAccSet',{
				ZlFrom: _val,
				ZlSite: _pl
			})

			let _vData = {
				ZlFrom: _val,
				ZlSite: _pl,
				WBS: _prq.WBS,
				bWBS: _prq.bWBS,
				bCC: _prq.bCC
			};

			_mdl.callFunction("/validateGLAcc", {
				urlParameters : _vData,
				success : function(oData, response) {
					if(!!oData.ZlFrom){
						_mdl.setProperty(_sp+'/GLAcc',oData.ZlFrom);
						_mdl.setProperty(_sp+'/GLtext',oData.ZlDesc);
						_self.byId('itemAccGLSel').setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
						_self.byId('itemAccGLSel').setSelectedKey(oData.ZlFrom);
						_control.setValueState(sap.ui.core.ValueState.None);
						_control.setValueStateText('');	

					} else {
						_mdl.setProperty(_sp+'/GLAcc','');
						_mdl.setProperty(_sp+'/GLtext', _val);
						_self.byId('itemAccGLSel').setValue(_val);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid Gl Account');	

					}
				},
				error : function(oError) {
					_mdl.setProperty(_sp+'/GLAcc','');
					_mdl.setProperty(_sp+'/GLtext',_val);
					_self.byId('itemAccGLSel').setValue(_val);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid GL Account');	

				},
			});

		},

		onChargeNumItemSelected: function(oEvent){
			let _mHdr = oEvent.oSource.getModel('mHdr'),
				_val = oEvent.oSource.getValue();

			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.ZlFrom:null,
				sTxt = (!!sObj)?sObj.ZlDesc:null,
				_control = oEvent.oSource;

			if(!sKey) return;

			if(sKey){
				_mHdr.setProperty('/ChargeNum',sKey);
				_control.setValue('('+sKey+') '+sTxt);	
				// _control.setSelectedKey(sKey);
	
				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText('');	
			}
			
			if(sTxt){
				_mHdr.setProperty('/ChargeNumTxt',sTxt);
			}


		},

		onGenChargeNumItemSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext(),
				_sp = (!!_ctx)?_ctx.sPath:null,
				_mdl = (!!_ctx)?_ctx.oModel:null,			
				_val = oEvent.oSource.getValue();

			let sRow = oEvent.getParameter('selectedRow');			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.ZlFrom:null,
				sTxt = (!!sObj)?sObj.ZlDesc:null,
				_control = oEvent.oSource;

			if(!sKey) return;
			if(!_sp) return;

			if(sKey){
				_mdl.setProperty(_sp+'/ChargeNum',sKey);
				// _mdl.setProperty(_sp+'/ChargeNumTxt',sTxt);

				_control.setValue('('+sKey+') '+sTxt);	
				// _control.setSelectedKey(sKey);
				_control.setValueState(sap.ui.core.ValueState.None);
				_control.setValueStateText('');	
	
			}

			if(sTxt){
				_mdl.setProperty(_sp+'/ChargeNumTxt',sTxt);
			}


		},


		onAccWBSItemSelected: function(oEvent){

			let sRow = oEvent.getParameter('selectedRow');			
			if(!sRow) return;
			
			let _ctx = oEvent.oSource.getBindingContext();
			if(!_ctx) return false;


			let _user = this.getUser(),
				_obj = (!!_ctx)?_ctx.getObject():null,
				_mdl = (!!_ctx)?_ctx.oModel:null,
				_val = oEvent.oSource.getValue().toUpperCase(),
				_sp = (!!_ctx)?_ctx.sPath:null;
			
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				_prq = oEvent.oSource.getBindingContext().getObject(),
				_key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				_pl = _mdl.getProperty(_key+'/Plant'),
				sNew = !sRow,
			    sKey = (!!sObj)?sObj.ZlFrom:_val,
				sTxt = (!!sObj)?sObj.ZlDesc:_val,
				_control = oEvent.oSource;

			if(!sKey) return;
			if(!_sp) return;

			let _mKey = _mdl.createKey('/ChargeCodeSet',{
				ZlFrom: sKey,
				ZlSite: _pl
			})

			_mdl.read(_mKey,{
				success: function(oData){
					if(!!oData.ZlFrom){
						_mdl.setProperty(_sp+'/WBS',oData.ZlFrom);
						_mdl.setProperty(_sp+'/WBStext',oData.ZlDesc);
						_mdl.setProperty(_sp+'/Contract',oData.ZlPrimCont);
						_control.setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
						if(!oData.bInsp) {
							_control.setValueState(sap.ui.core.ValueState.Error);
							_control.setValueStateText('Only non-Inspectable WBS allowed');	
						} else {
							_control.setValueState(sap.ui.core.ValueState.None);
							_control.setValueStateText('');	
						}
					} else {
						_mdl.setProperty(_sp+'/WBS',sKey);
						_mdl.setProperty(_sp+'/WBStext', sTxt);
						_mdl.setProperty(_sp+'/Contract','');
						_control.setValue('('+sKey+') '+ sTxt);	
						_control.setValueState(sap.ui.core.ValueState.Error);
						_control.setValueStateText('Invalid WBS');	
					}		
				},
				error: function(oData){
					_mdl.setProperty(_sp+'/WBS',sKey);
					_mdl.setProperty(_sp+'/WBStext',sTxt);
					_mdl.setProperty(_sp+'/Contract','');
					_control.setValue('('+sKey+') '+sTxt);	
					_control.setValueState(sap.ui.core.ValueState.Error);
					_control.setValueStateText('Invalid WBS');	
						}
			})



		},

		onAccCCItemSelected: function(oEvent){
			let sRow = oEvent.getParameter('selectedRow');	
			if(!sRow) return;

			let _ctx = oEvent.oSource.getBindingContext();
			if(!_ctx) return false;



			let	
				// _obj = (!!_ctx)?_ctx.getObject():null,
				_mdl = _ctx.oModel,
				// _user = this.getUser()
				// _prq = oEvent.oSource.getBindingContext().getObject(),
				// _key = _mdl.createKey('/HeaderSet',{'PrqNo':_prq.PrqNo, 'Userid':_user.getId()}),
				// _pl = _mdl.getProperty(_key+'/Plant'),
				// _val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
					
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
			    sKey = (!!sObj)?sObj.ZlFrom:_val,
				sTxt = (!!sObj)?sObj.ZlDesc:_val,
				_control = oEvent.oSource;

			if(!sKey) return;

			_mdl.setProperty(_sp+'/CostCenter',sKey);
			_mdl.setProperty(_sp+'/CCtext',sTxt);

			_control.setValue('('+sKey+') '+sTxt);	

			_control.setValueState(sap.ui.core.ValueState.None);
			_control.setValueStateText('');	

			// let _mKey = _mdl.createKey('/CostCenterSet',{
			// 	ZlFrom: sKey,
			// 	ZlSite: _pl
			// })

			// _mdl.read(_mKey,{
			// 	success: function(oData){
			// 		if(!!oData.ZlFrom){
			// 			_mdl.setProperty(_sp+'/CostCenter',oData.ZlFrom);
			// 			_mdl.setProperty(_sp+'/CCtext',oData.ZlDesc);
			// 			_control.setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
			// 			// _self.byId('itemAccCCSel').setSelectedKey(oData.ZlFrom);
			// 			_control.setValueState(sap.ui.core.ValueState.None);
			// 			_control.setValueStateText('');	
			// 			// _mdl.refresh(true);

			// 		} else {
			// 			_mdl.setProperty(_sp+'/CostCenter',sKey);
			// 			_mdl.setProperty(_sp+'/CCtext', sTxt);
			// 			_control.setValue('('+sKey+') '+ sTxt);	
			// 			_control.setValueState(sap.ui.core.ValueState.Error);
			// 			_control.setValueStateText('Invalid Cost Center');	

			// 			// _mdl.refresh(true);
			// 		}
			// 	},
			// 	error: function(oData){
			// 		_mdl.setProperty(_sp+'/CostCenter',sKey);
			// 		_mdl.setProperty(_sp+'/CCtext',sTxt);		
			// 		_control.setValue('('+sKey+') '+sTxt);	
			// 		_control.setValueState(sap.ui.core.ValueState.Error);
			// 		_control.setValueStateText('Invalid Cost Center');	

			// 		// _mdl.refresh(true);
			// 	}
			// })



		},

		onAccGLItemSelected: function(oEvent){
			let _ctx = oEvent.oSource.getBindingContext();
			if(!_ctx) return false;

			let sRow = oEvent.getParameter('selectedRow');					
			if(!sRow) return false;

			let	_mdl = _ctx.oModel,
				// _val = oEvent.oSource.getValue(),
				_sp = _ctx.sPath;
				
			let sObj = (!!sRow)?sRow.getBindingContext().getObject():null,
				_control = oEvent.oSource,
			    sKey = (!!sObj)?sObj.ZlFrom:_val,
				sTxt = (!!sObj)?sObj.ZlDesc:_val;

			if(!sKey) return;

			_mdl.setProperty(_sp+'/GLAcc',sKey);
			_mdl.setProperty(_sp+'/GLtext',sTxt);

			_control.setValue('('+sKey+') '+sTxt);	

			_control.setValueState(sap.ui.core.ValueState.None);
			_control.setValueStateText('');	

			// let _mKey = _mdl.createKey('/GLAccSet',{
			// 	ZlFrom: _val,
			// 	ZlSite: _pl
			// })

			// let _vData = {
			// 	ZlFrom: sKey,
			// 	ZlSite: _pl,
			// 	WBS: _prq.WBS,
			// 	bWBS: _prq.bWBS,
			// 	bCC: _prq.bCC
			// };

			// _mdl.callFunction("/validateGLAcc", {
			// 	urlParameters : _vData,
			// 	success : function(oData, response) {
			// 		if(!!oData.ZlFrom){
			// 			_mdl.setProperty(_sp+'/GLAcc',oData.ZlFrom);
			// 			_mdl.setProperty(_sp+'/GLtext',oData.ZlDesc);
			// 			_control.setValue('('+oData.ZlFrom+') '+oData.ZlDesc);	
			// 			_control.setSelectedKey(oData.ZlFrom);
			// 			_control.setValueState(sap.ui.core.ValueState.None);
			// 			_control.setValueStateText('');	

			// 		} else {
			// 			_mdl.setProperty(_sp+'/GLAcc',sKey);
			// 			_mdl.setProperty(_sp+'/GLtext', sTxt);
			// 			_control.setValue('('+sKey+') '+ sTxt);	
			// 			_control.setValueState(sap.ui.core.ValueState.Error);
			// 			_control.setValueStateText('Invalid Gl Account');	

			// 		}
			// 	},
			// 	error : function(oError) {
			// 		_mdl.setProperty(_sp+'/GLAcc',sKey);
			// 		_mdl.setProperty(_sp+'/GLtext',sTxt);
			// 		_control.setValue('('+sKey+') '+ sTxt);	
			// 		_control.setValueState(sap.ui.core.ValueState.Error);
			// 		_control.setValueStateText('Invalid GL Account');	

			// 	},
			// });




		},

		generateSHA256Hash: function(sVal){
			const encoder = new TextEncoder();
			const data = encoder.encode(sVal);
			crypto.subtle.digest('SHA-256', data)
			.then(function(hashBuffer){
				let hashArray = Array.from(new Uint8Array(hashBuffer));
				return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
			})
		
		},

		getUser: function(){
			// let _debugMode = this.getModel("appView").getProperty("/useDebug");
			// let _debugUser = this.getModel("appView").getProperty("/debugUser");
			// if(_debugMode){
			// 	return _debugUser;
			// } else {
				return sap.ushell.Container.getService('UserInfo');	
			// }
			
		},

		// getAllVariants: function(fnCallBack) {
		// 	var oPersonalizationVariantSet= {},
		// 		aExistingVariants =[],
		// 		oView = this.getView(),
		// 		oTab = this.byId("lineItemsList"),
		// 		aVariantKeysAndNames =[];

		// 	if(!oTab) return false;

			
		// 	//get the personalization service of shell
		// 	this._oPersonalizationService = sap.ushell.Container.getService('Personalization');
		// 	this._oPersonalizationContainer = this._oPersonalizationService.getPersonalizationContainer("ULADashboardPersonalization");
		// 	this._oPersonalizationContainer.fail(function() {
		// 		// call back function in case of fail
		// 		fnCallBack(aExistingVariants);
		// 	});
		// 	this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
		// 		// check if the current variant set exists, If not, add the new variant set to the container
		// 		if (!(oPersonalizationContainer.containsVariantSet('DashboardVariants'))) {
		// 			oPersonalizationContainer.addVariantSet('DashboardVariants');
		// 		}
		// 		// get the variant set
		// 		oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet('DashboardVariants');
		// 		aVariantKeysAndNames = oPersonalizationVariantSet.getVariantNamesAndKeys();
		// 		for(var key in aVariantKeysAndNames){
		// 			if (aVariantKeysAndNames.hasOwnProperty(key)) {
		// 				var oVariantItemObject = {};
		// 				oVariantItemObject.VariantKey = aVariantKeysAndNames[key];
		// 				oVariantItemObject.VariantName = key;

		// 				this.getVariantFromKey(aVariantKeysAndNames[key], function(oVariant){
		// 					if(!oVariant) return;
		// 					if (oVariant.getItemValue("Default")) {
		// 						oView.byId("variantManagement").setDefaultVariantKey(aVariantKeysAndNames[key]);
		// 						oView.byId("variantManagement").setInitialSelectionKey(aVariantKeysAndNames[key]);
		// 						oVariantItemObject.Default = true;

		// 						var _layout = JSON.parse(oVariant.getItemValue('Dashboard'));
		// 						oTab.getColumns().forEach( ccol => {
		// 							var _ll = _layout.find(el=> {return(el.prop.name===ccol.getProperty('name'))});
		// 							if(_ll){
		// 								Object.keys(_ll.prop).forEach(propKey => {
		// 									ccol.setProperty(propKey,_ll.prop[propKey]);
		// 								})
		// 								ccol.setVisible(_ll.visible);
		// 							}
		// 						})
			
		// 					}
		// 				})
		// 				aExistingVariants.push(oVariantItemObject);


		// 			}
		// 		}
		// 		fnCallBack(aExistingVariants);
		// 	}.bind(this));
		// },

		// onSelectVariant: function(oEvent) {
		// 	var sSelectedVariantKey = oEvent.mParameters.key;
		// 	this.setSelectedVariant(sSelectedVariantKey);
		// },
		// setSelectedVariant: function(sSelectedVariantKey) {
		// 	// let _app = this.getModel("appView");
		// 	if (sSelectedVariantKey) {
		// 		this.getVariantFromKey(sSelectedVariantKey, function(oSelectedVariant){
		// 		   var _layout;
		// 		   if(oSelectedVariant) {
		// 			   _layout = JSON.parse(oSelectedVariant.getItemValue('Dashboard'));
		// 		   } else {
		// 			   _layout = null;
		// 		   }

		// 		   if(!!_layout){
		// 				this.byId("lineItemsList").getColumns().forEach( ccol => {
		// 					var _ll = _layout.find(el=> {return(el.prop.name===ccol.getProperty('name'))});
		// 					if(_ll){
		// 						Object.keys(_ll.prop).forEach(propKey => {
		// 							ccol.setProperty(propKey,_ll.prop[propKey]);
		// 						})
		// 						ccol.setVisible(_ll.visible);
		// 					}
		// 				}) 
		// 		   }
		// 	   }.bind(this));
		//    }

		// },
		// getVariantFromKey: function(sVariantKey, fnCallback) {
		// 	this._oPersonalizationContainer.fail(function() {
		// 		// call back function in case of fail
		// 		if (fnCallback) {
		// 			fnCallback('');
		// 		}
		// 	});
		// 	this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
		// 		var oPersonalizationVariantSet ={};
		// 		// check if the current variant set exists, If not, add the new variant set to the container
		// 		if (!(oPersonalizationContainer.containsVariantSet('DashboardVariants'))) {
		// 			oPersonalizationContainer.addVariantSet('DashboardVariants');
		// 		}
		// 		// get the variant set
		// 		oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet('DashboardVariants');
		// 		fnCallback(oPersonalizationVariantSet.getVariant(sVariantKey));
		// 	});
		// },		
		// onSaveAsVariant: function(oEvent) {
		// 	var bDefault = oEvent.getParameter('def');
		// 	// var _colData = this.byId("WorkloadTable").getColumns().map(function(cc){ return $.extend(cc.mProperties,{visible:cc.getVisible()})});
		// 	var _colData = this.byId("lineItemsList").getColumns().map(function(cc){ return {prop:cc.mProperties,visible:cc.getVisible()}});
		// 	 this.saveVariant(oEvent.mParameters.name, _colData, bDefault, function(oVariant) {
		// 		var oVariantMgmtControl = this.getView().byId("variantManagement"),
		// 			oVariantModel = new sap.ui.model.json.JSONModel();
		// 		this.getAllVariants(function(aVariants){
		// 			oVariantModel.oData.Variants = aVariants;
		// 			oVariantMgmtControl.setModel(oVariantModel);    
		// 			// oVariantMgmtControl.oVariantSave.onAfterRendering = function(){this.setEnabled(true);};
		// 		}.bind(this));		
		// 		if(bDefault){
		// 			this.setSelectedVariant(oVariant.getVariantKey());
		// 			oVariantMgmtControl._setVariantText(oVariant.getVariantName())
		// 			// this.setSelectedVariant(sSelectedVariantKey);
		// 		}       
	
		// 		//Do the required actions
		// 	}.bind(this));
		// },

		// saveVariant: function(sVariantName, oTableData, bDefault, fnCallBack) {
		// 	// save variants in personalization container
		// 	this._oPersonalizationContainer.fail(function() {
		// 		// call back function in case of fail
		// 		fnCallBack(false);
		// 	});
		// 	this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
		// 		var oPersonalizationVariantSet ={},
		// 			oVariant = {},
		// 			sVariantKey = "";
		// 		// check if the current variant set exists, If not, add the new variant set to the container
		// 		if (!(oPersonalizationContainer.containsVariantSet("DashboardVariants"))) {
		// 			oPersonalizationContainer.addVariantSet('DashboardVariants');
		// 		}
		// 		// get the variant set
		// 		oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet('DashboardVariants');
				
		// 		//get if the variant exists or add new variant
		// 		sVariantKey = oPersonalizationVariantSet.getVariantKeyByName(sVariantName);
		// 		if (sVariantKey) {
		// 			   oVariant = oPersonalizationVariantSet.getVariant(sVariantKey);
		// 		} else {
		// 			   oVariant = oPersonalizationVariantSet.addVariant(sVariantName);
		// 		}
		// 		if (oTableData) {
		// 			oVariant.setItemValue('Dashboard', JSON.stringify(oTableData));
		// 		}

		// 		if (bDefault) {
		// 			oPersonalizationVariantSet.getVariantKeys().forEach(function (sKey) {
		// 				oPersonalizationVariantSet.getVariant(sKey).setItemValue("Default", false);
		// 			});
					
		// 			oVariant.setItemValue("Default", true);
		// 		}

		// 		oPersonalizationContainer.save().fail(function() {
		// 		   //call callback fn with false
		// 			fnCallBack(false);
		// 		}).done(function() {
		// 		   //call call back with true
		// 			fnCallBack(oVariant);
		// 		}.bind(this));
		// 	}.bind(this));
		// },	
		// onManageVariant: function(oEvent) {
		// 	var aDeletedVariants = oEvent.mParameters.deleted,
		// 		aRenamedVariants = oEvent.mParameters.renamed,
		// 		sNewDefaultVariantKey = oEvent.mParameters.def;
		// 	if (aDeletedVariants.length>0) {
		// 		this.deleteVariants(aDeletedVariants, function(bDeleted) {
		// 			// delete success if bDeleted is true
		// 		});
		// 	}
		// 	if(aRenamedVariants.length>0) {
		// 		// get the variants from variant set and rename them in the personalization variant set and then save it.
		// 	}
		// },
	
		// deleteVariants: function(aVariantKeys, fnCallback) {
		// 	var oPersonalizationVariantSet ={};
		// 	this._oPersonalizationContainer.fail(function() {
		// 		//handle failure case
		// 	});
		// 	this._oPersonalizationContainer.done(function(oPersonalizationContainer) {
		// 		if (!(oPersonalizationContainer.containsVariantSet("DashboardVariants"))) {
		// 			oPersonalizationContainer.addVariantSet("DashboardVariants");
		// 		}
		// 		oPersonalizationVariantSet = oPersonalizationContainer.getVariantSet("DashboardVariants");
		// 		for (var iCount=0; iCount<aVariantKeys.length; iCount++) {
		// 			if (aVariantKeys[iCount]) {
		// 				oPersonalizationVariantSet.delVariant(aVariantKeys[iCount]);
		// 			}
		// 		}
		// 		oPersonalizationContainer.save().fail(function() {
		// 			//handle failure case
		// 			fnCallback(false);
		// 		}).done(function() {
		// 			fnCallback(true);
		// 		}.bind(this));
		// 	}.bind(this));
		// },
		// onPersonalizationDialogPress: function() {
		// 	var oView = this.getView();
		// 	var _self = this;
	
		// 	// if (!this._pPersonalizationDialog){
		// 	var _fDialog = Fragment.load({
		// 			id: oView.getId(),
		// 			name: "lmco.ces.preq.view.fragments.PersDialog",
		// 			controller: this
		// 		}).then(function(oPersonalizationDialog){
		// 			oView.addDependent(oPersonalizationDialog);
		// 			let _pData = this.fillPersData();

		// 			this.getView().getModel("pers").setProperty("/", deepExtend([], _pData));
		// 			//this.getModel("pers").setData(this.fillPersData());
		// 			//var oPersModel = new JSONModel(deepExtend({}, this.oDataInitial));
		// 			//this.setModel(oPersModel, "pers");
	
		// 			oPersonalizationDialog.setModel(this.getView().getModel("pers"));
		// 			return oPersonalizationDialog;
		// 		}.bind(this));
		// 	// }
		// 	_fDialog.then(function(oPersonalizationDialog){
		// 		this.getView().getModel("pers").setProperty("/ShowResetEnabled", this._isChangedColumnsItems());
		// 		this.oDataBeforeOpen = deepExtend({}, this.getView().getModel("pers").getData());
		// 		oPersonalizationDialog.open();
		// 	}.bind(this));
		// },
		// fillPersData: function(){
		// 	var _items = [], _cols = [];
			
		// 	this.byId("lineItemsList").getColumns().forEach(function(column){ 
		// 		let _name = column.getName();
		// 		if(!!_name) {
		// 			_items.push({'columnKey': column.getName(), 'text': column.getLabel().getProperty('text')});
		// 			_cols.push({'columnKey': column.getName(),'index': column.getIndex(), 'visible': column.getVisible()});				
		// 		}			
		// 	});
		// 	return {'Items':_items, 'ColumnsItems':_cols};
			
		// },
		// onOK: function(oEvent){
		// 	this.oDataBeforeOpen = {};
		// 	var _mdl = this.getView().getModel("pers");
		// 	this.byId("lineItemsList").getColumns().forEach(function(column, idx){ 
		// 		var _c = _mdl.oData.ColumnsItems.find(elem => elem.columnKey === column.getName());
		// 		var _vis = (_c) ? _c.visible : column.getVisible();
		// 		column.setVisible(_vis);
		// 		if (column.getSorted()) {
		// 			_sorter.push(new sap.ui.model.Sorter(column.getSortProperty(), column.getSortOrder() != 'Ascending'))	
		// 		}				
		// 	});
	
		// 	// this.buildFilters();						
		// 	// this.fireSearch();			
		// 	oEvent.getSource().close();
		// 	oEvent.getSource().destroy();
		// },
	
		// onCancel: function(oEvent) {
		// 	this.getView().getModel("pers").setProperty("/", deepExtend([], this.oDataBeforeOpen));
	
		// 	this.oDataBeforeOpen = {};
		// 	oEvent.getSource().close();
		// 	oEvent.getSource().destroy();
		// },
		// _isChangedColumnsItems: function() {
		// 	var fnGetArrayElementByKey = function(sKey, sValue, aArray) {
		// 		var aElements = aArray.filter(function(oElement) {
		// 			return oElement[sKey] !== undefined && oElement[sKey] === sValue;
		// 		});
		// 		return aElements.length ? aElements[0] : null;
		// 	};
		// 	var fnGetUnion = function(aDataBase, aData) {
		// 		if (!aData) {
		// 			return deepExtend([], aDataBase);
		// 		}
		// 		var aUnion = deepExtend([], aData);
		// 		aDataBase.forEach(function(oMItemBase) {
		// 			var oMItemUnion = fnGetArrayElementByKey("columnKey", oMItemBase.columnKey, aUnion);
		// 			if (!oMItemUnion) {
		// 				aUnion.push(oMItemBase);
		// 				return;
		// 			}
		// 			if (oMItemUnion.visible === undefined && oMItemBase.visible !== undefined) {
		// 				oMItemUnion.visible = oMItemBase.visible;
		// 			}
		// 			if (oMItemUnion.width === undefined && oMItemBase.width !== undefined) {
		// 				oMItemUnion.width = oMItemBase.width;
		// 			}
		// 			if (oMItemUnion.total === undefined && oMItemBase.total !== undefined) {
		// 				oMItemUnion.total = oMItemBase.total;
		// 			}
		// 			if (oMItemUnion.index === undefined && oMItemBase.index !== undefined) {
		// 				oMItemUnion.index = oMItemBase.index;
		// 			}
		// 		});
		// 		return aUnion;
		// 	};
		// 	var fnIsEqual = function(aDataBase, aData) {
		// 		if (!aData) {
		// 			return true;
		// 		}
		// 		if (aDataBase.length !== aData.length) {
		// 			return false;
		// 		}
		// 		var fnSort = function(a, b) {
		// 			if (a.columnKey < b.columnKey) {
		// 				return -1;
		// 			} else if (a.columnKey > b.columnKey) {
		// 				return 1;
		// 			} else {
		// 				return 0;
		// 			}
		// 		};
		// 		aDataBase.sort(fnSort);
		// 		aData.sort(fnSort);
		// 		var aItemsNotEqual = aDataBase.filter(function(oDataBase, iIndex) {
		// 			return oDataBase.columnKey !== aData[iIndex].columnKey || oDataBase.visible !== aData[iIndex].visible || oDataBase.index !== aData[iIndex].index || oDataBase.width !== aData[iIndex].width || oDataBase.total !== aData[iIndex].total;
		// 		});
		// 		return aItemsNotEqual.length === 0;
		// 	};
	
		// 	var aDataRuntime = fnGetUnion(this.oDataInitial.ColumnsItems, this.getView().getModel("pers").getProperty("/ColumnsItems"));
		// 	return !fnIsEqual(aDataRuntime, this.oDataInitial.ColumnsItems);
		// },

		_doCloseItemDetail: function () {
			var bReplace = !sap.ui.Device.system.phone;
			this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel("appView").setProperty("/itemView", false);
			// this.getRouter().navTo("object", {
			// 	objectId: this._sObjectId,
			// 	query: {
			// 		tab: 'itemList'
			// 	}
			// }, bReplace);// true without history

			// this.getRouter().navTo("object", {
			// 	objectId : this._sObjectId
			// }, bReplace);

		},

		_getRandomUUID: function() {
			let d = new Date().getTime();
			return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			        var r = (d + Math.random()*16)%16 | 0;
			        d = Math.floor(d/16);
			        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
			})
		}


	});
});
