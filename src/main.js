/*
 * Copyright © 2020. TIBCO Software Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

//@ts-check - Get type warnings from the TypeScript language server. Remove if not wanted.

/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
Spotfire.initialize(async (mod) => {
    /**
     * Create the read function.
     */
    const reader = mod.createReader(
        mod.visualization.data(),
        mod.property("useCustomRowIdentifierExpression"),
        mod.windowSize(),
        mod.property("modSettings")
    );

    const modDiv = document.querySelector(".container");


    /**
     * Store the context.
     */
    const context = mod.getRenderContext();

    /**
     * Initiate the read loop
     */
    reader.subscribe(render);

    /**
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.ModProperty<boolean>} useCustomRowIdentifierExpression 
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.ModProperty<String>} modSettings
    */
    async function render(
        dataView,
        useCustomRowIdentifierExpression,
        windowSize,
        modSettings
    ) {
        //clear console log
        console.clear();

        // set this variable to true (run once and put it back to false) to reset the mod properties settings as if it was a new visualziton mod without having to create one
        let override = false;
        if (override) useCustomRowIdentifierExpression.set(false)
        if (override) modSettings.set("{}")

        //show or hide settings button  
        document.getElementById("configButton").hidden = !context.isEditing;


        //1. Check for errors
        let errors = await dataView.getErrors();


        //1.a Check if ID is empty
        let measureAxis = await mod.visualization.axis("Row ID");
        if (measureAxis.parts.length == 0 || measureAxis.parts[0].expression !== "baserowid()" && !useCustomRowIdentifierExpression.value()) {
            ConfusionMatrix.createWarning(modDiv, context.styling.general.font.color, measureAxis, useCustomRowIdentifierExpression);
            mod.controls.errorOverlay.hide();
            return;
        } else {
            ConfusionMatrix.clearWarning(modDiv);
        }


        //1.b Check the additional errors
        if (errors.length > 0) {
            mod.controls.errorOverlay.show(errors);
            return;
        }
        //1.c No errors, clear warnings and continue
        mod.controls.errorOverlay.hide();



        //2. DATA (either 2.1a or 2.1b)
        //2.1a Testing with sample data
        // let arr1 = ['black', 'pink', 'pink', 'pink', 'orange', 'black', 'purple', 'yellow', "orange"]
        // let arr2 = ['black', 'pink', 'pink', 'pink', 'pink', 'black', 'purple', 'yellow', "orange"]

        //2.1a use this to export sample data to CSV and paste it to a dxp
        // var csv = "";for (var i = 0; i < arr1.length; i++) {csv += arr1[i] + "," + arr2[i] + "\n";}console.log(csv);

        //2.1b Get data from spotfire (comment block to use sample data from 2.1a)
        //helper function that gets a tupple from the data


        let rows = dataView.allRows();
        let arr1 = (await rows).map((r,i) => {return {dataViewRow:"r"+i,category:r.categorical("Actual").formattedValue()}});
        let arr2 = (await rows).map((r,i) => {return {dataViewRow:"r"+i,category:r.categorical("Predicted").formattedValue()}});
// arr1 = arr1.slice(0,4);
// arr2 = arr2.slice(0,4);
// console.log(arr1,arr2);
                              
        //3 Settings
        //read settings from mod. Default is {} but will take default values from input controls 
        // ConfusionMatrix.settings.init();




        // reads and writes settings. Can't figure out how to move this funciton to Matrix.js and pass modSettings as a parameter
        (function initSettings() {


            //if first time, set default settings from markup
            let chartSettings = JSON.parse(modSettings.value());
            if (!Object.keys(chartSettings).length) modSettings.set(JSON.stringify(ConfusionMatrix.settings.chartSettings()));

            //ready to read interface values with stored mod settings
            document.getElementById("color1").value = chartSettings.color1;
            document.getElementById("color2").value = chartSettings.color2;
            document.getElementById("showLabels").checked = chartSettings.showLabels;
            document.getElementById("showValues").checked = chartSettings.showValues;
            document.getElementById("showZeros").checked = chartSettings.showZeros;
            document.getElementById("isSorted").checked = chartSettings.isSorted;

            //on change, update modSettings
            function set() {
                modSettings.set(JSON.stringify(ConfusionMatrix.settings.chartSettings()));
            }

            //Event handlers
            //save modSettings on change
            document.getElementById("color1").onchange = set;
            document.getElementById("color2").onchange = set;
            document.getElementById("showLabels").onchange = set;
            document.getElementById("showValues").onchange = set;
            document.getElementById("showZeros").onchange = set;
            document.getElementById("isSorted").onchange = set;

            //close settings when clicking out of it
            document.getElementById("mod-container").addEventListener("click", ConfusionMatrix.settings.close);

            //close settings when clicking on close icon
            document.querySelector(".fromCloseBtn").addEventListener("click", ConfusionMatrix.settings.close);

        })();

        // let compute = ConfusionMatrix.compute(arr1,arr2);
        let compute = ConfusionMatrix.compute2(arr1,arr2);
        console.log(compute)

        let chartSettings = ConfusionMatrix.settings.chartSettings();
        ConfusionMatrix.draw({
            container: '.container',
            height: windowSize.height,
            width: windowSize.width,
            maxColor: chartSettings.color1,
            minColor: chartSettings.color2,
            showLabels: chartSettings.showLabels,
            showValues: chartSettings.showValues,
            showZeros: chartSettings.showZeros,
            data: compute.matrix,
            labels: compute.categories
        }, context.styling);


        // Signal that the mod is ready for export.
        context.signalRenderComplete();
    }
});

