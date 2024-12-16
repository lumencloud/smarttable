/*global QUnit*/

sap.ui.define([
	"smarttable/controller/SmartTable.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SmartTable Controller");

	QUnit.test("I should test the SmartTable controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
