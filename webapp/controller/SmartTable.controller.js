sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    let currentID = 111; // 초기 ID 값

    return Controller.extend("smarttable.controller.SmartTable", {
        onInit: function () {
            // 필요한 초기화 작업
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

            // 모든 엔티티를 가져옴
            oModel.read("/Products", {
                success: function (oData) {
                    let aProducts = oData.results;

                    // 중복된 데이터를 필터링
                    let duplicateProducts = aProducts.filter(p => p.ID === 111);

                    // 특정 엔터티 삭제 (필요에 따라 조건 추가)
                    duplicateProducts.forEach(product => {
                        oModel.remove("/Products(" + product.ID + ")", {
                            success: function () {
                                sap.m.MessageToast.show("Entry deleted successfully.");
                            },
                            error: function (oError) {
                                sap.m.MessageToast.show("Error deleting entry.");
                                console.error("Error details:", oError);
                            }
                        });
                    });
                },
                error: function (oError) {
                    sap.m.MessageToast.show("Error fetching products.");
                    console.error("Error details:", oError);
                }
            });
        }
    });
});