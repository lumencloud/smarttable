sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass"
], function (Controller,
    MessageToast,
    Dialog,
    VBox,
    Button,
    Input,
    Label,
    MessageBox,
    Fragment,
    syncStyleClass) {
    "use strict";


    return Controller.extend("smarttable.controller.SmartTable", {
        onInit: function () {

            let oTable = this.getView().byId("smartTable").getTable();
            oTable.setMode("MultiSelect");
            oTable.attachSelectionChange(this.onTableSelection, this);

        },
        onTableSelection: function () {
            let aSelectedItems = this.getView().byId("smartTable").getTable().getSelectedItems();
            this.getView().byId("btnMultiEdit").setEnabled(aSelectedItems.length > 0);
        },
        onCreate: function () {
            let oModel = this.getView().byId("smartTable").getModel();
            oModel.setUseBatch(false);

            // ID 자동 증가
            currentID += 1;

            // 생성할 데이터 정의
            let oNewProduct = {
                ID: currentID, // 자동 증가된 ID 사용
                Name: "New Test Product",
                Description: "This is a test product.",
                ReleaseDate: "/Date(1672531200000)/", // 2023-01-01
                DiscontinuedDate: "/Date(1735689600000)/", // 2024-12-31
                Rating: "5",
                Price: "204.22"
            };

            // OData 엔터티 생성
            oModel.create("/Products", oNewProduct, {
                success: function (oData) {
                    MessageToast.show("Product created successfully!");
                    console.log("Created product:", oData);
                },
                error: function (oError) {
                    MessageToast.show("Error creating product.");
                    console.error("Error details:", oError);
                }
            });
        },
        onDelete: function () {
            let oModel = this.getView().byId("smartTable").getModel();
            oModel.setUseBatch(false);
            let items = this.getView().byId("table").getSelectedItems();

            items.forEach(product => {
                let id = product.getBindingContext().getProperty("ID");
                oModel.remove("/Products(" + id + ")", {
                    success: function () {
                        MessageToast.show("Entry deleted successfully.");
                    },
                    error: function (oError) {
                        MessageToast.show("Error deleting entry.");
                        console.error("Error details:", oError);
                    }
                });
            });
        },
        onCreateProduct: function () {
            let oDialog = new Dialog({
                title: 'Add New Product',
                type: 'Message',
                content: new VBox({
                    items: [
                        new Label({ text: 'Name' }),
                        new Input({ id: this.createId("nameInput") }), // Name 입력 필드
                        new Label({ text: 'Description' }),
                        new Input({ id: this.createId("descriptionInput") }), // Description 입력 필드
                        new Label({ text: 'Rating' }),
                        new Input({ id: this.createId("ratingInput") }), // Rating 입력 필드
                        new Label({ text: 'Price' }),
                        new Input({ id: this.createId("priceInput") }) // Price 입력 필드
                    ]
                }),
                beginButton: new Button({
                    text: 'Add',
                    press: function () {
                        this._addNewProduct();
                        oDialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: 'Cancel',
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        _addNewProduct: function () {
            let oModel = this.getView().byId("smartTable").getModel();
            oModel.setUseBatch(false); // Batch 사용 비활성화 (필요 시 활성화 가능)

            // 입력값 가져오기
            let sName = this.byId("nameInput").getValue();
            let sDescription = this.byId("descriptionInput").getValue();
            let iRating = parseInt(this.byId("ratingInput").getValue(), 10);
            let fPrice = parseFloat(this.byId("priceInput").getValue()).toFixed(2);;

            // Products 엔터티셋에서 현재 ID 값 중 최대값 가져오기
            oModel.read("/Products", {
                success: function (oData) {
                    let aProducts = oData.results;

                    // 현재 데이터에서 ID 필드를 기반으로 최대값 계산
                    let maxID = aProducts.reduce((max, product) => {
                        return product.ID > max ? product.ID : max;
                    }, 0); // 초기값 0

                    // 새로운 데이터 객체 정의
                    let oNewProductData = {
                        ID: maxID + 1,
                        Name: sName,
                        Description: sDescription,
                        Rating: iRating,
                        Price: fPrice.toString(),
                        ReleaseDate: "/Date(1672531200000)/", // 기본값
                        DiscontinuedDate: "/Date(1735689600000)/", // 기본값
                    };

                    // OData Create 요청
                    oModel.create("/Products", oNewProductData, {
                        success: function (oData) {
                            MessageToast.show("Product created successfully!");
                            console.log("Created product:", oData);
                        },
                        error: function (oError) {
                            MessageToast.show("Error creating product.");
                            console.error("Error details:", oError);
                        }
                    });
                },
                error: function (oError) {
                    MessageToast.show("Error fetching products.");
                    console.error("Error details:", oError);
                }
            });
        },
        onOpenMultiEdit: function () {
            Fragment.load({
                name: "smarttable.view.MultiEdit",
                controller: this
            }).then(function (oFragment) {
                this.oMultiEditDialog = oFragment;
                this.getView().addDependent(this.oMultiEditDialog);

                this.oMultiEditDialog.setEscapeHandler(function () {
                    this.onCloseDialog();
                }.bind(this));

                this.oMultiEditDialog.getContent()[0].setContexts(this.getView().byId("smartTable").getTable().getSelectedContexts());
                syncStyleClass("sapUiSizeCompact", this.getView(), this.oMultiEditDialog);
                this.oMultiEditDialog.open();
            }.bind(this));
        },
        onCloseDialog: function () {
            this.oMultiEditDialog.close();
            this.oMultiEditDialog.destroy();
            this.oMultiEditDialog = null;
        },

        onDialogSaveButton: function () {
            let oMultiEditContainer = this.oMultiEditDialog.getContent()[0];

            this.oMultiEditDialog.setBusy(true);
            oMultiEditContainer.getErroneousFieldsAndTokens().then(function (aErrorFields) {
                this.oMultiEditDialog.setBusy(false);
                if (aErrorFields.length === 0) {
                    this._saveChanges();
                }
            }.bind(this)).catch(function () {
                this.oMultiEditDialog.setBusy(false);
            }.bind(this));
        },

        _saveChanges: function () {
            let oMultiEditContainer = this.oMultiEditDialog.getContent()[0],
                that = this,
                aUpdatedContexts,
                oContext,
                oUpdatedData,
                oObjectToUpdate,
                oUpdatedDataCopy;

            let fnHandler = function (oField) {
                let sPropName = oField.getPropertyName(),
                    sUomPropertyName = oField.getUnitOfMeasurePropertyName();
                if (!oField.getApplyToEmptyOnly() || !oObjectToUpdate[sPropName]
                    || (typeof oObjectToUpdate[sPropName] == "string" && !oObjectToUpdate[sPropName].trim())) {
                    oUpdatedDataCopy[sPropName] = oUpdatedData[sPropName];
                }
                if (oField.isComposite()) {
                    if (!oField.getApplyToEmptyOnly() || !oObjectToUpdate[sUomPropertyName]) {
                        oUpdatedDataCopy[sUomPropertyName] = oUpdatedData[sUomPropertyName];
                    }
                }
            };

            MessageToast.show("Save action started", {
                onClose: function () {
                    oMultiEditContainer.getAllUpdatedContexts(true).then(function (result) {
                        MessageToast.show("Updated contexts available", {
                            onClose: function () {
                                aUpdatedContexts = result;
                                for (let i = 0; i < aUpdatedContexts.length; i++) {
                                    oContext = aUpdatedContexts[i].context;
                                    oUpdatedData = aUpdatedContexts[i].data;
                                    oObjectToUpdate = oContext.getModel().getObject(oContext.getPath());
                                    oUpdatedDataCopy = {};
                                    this._getFields().filter(function (oField) {
                                        return !oField.isKeepExistingSelected();
                                    }).forEach(fnHandler);
                                    oContext.getModel().update(oContext.getPath(), oUpdatedDataCopy);
                                }
                                MessageToast.show("Model was updated");

                                that.onCloseDialog();
                            }.bind(this)
                        });
                    }.bind(oMultiEditContainer));
                }
            });
            this.oMultiEditDialog.close();
        }

    });
});