//draws d3 matrix


//not used yet. Maybe for tooltips. Returns the matrix accuracy
function accuracy(confusionMatrix) {
	var accuracy = 0;
	var total = 0;
	for (var i = 0; i < confusionMatrix.length; i++) {
		for (var j = 0; j < confusionMatrix[i].length; j++) {
			total += confusionMatrix[i][j];
			if (i == j) {
				accuracy += confusionMatrix[i][j];
			}
		}
	}
	return accuracy / total;
}

//helper function that returns the min and max from a confusion matrix. ConfusionMatrix function is used for the color scale.
function getMinMax(data) {
	let min = 1, max = 0;
	for (var i = 0; i < data.length; i++) {
		for (var j = 0; j < data[i].length; j++) {
			if (data[i][j] < min) {
				min = data[i][j];
			}
			if (data[i][j] > max) {
				max = data[i][j];
			}
		}
	}
	return [min, max];
}

//main ConfusionMatrix function that does ConfusionMatrix and that
const ConfusionMatrix = {

	//creates a warning on the mod to ensuer there is a rowid custom expression to ensure all data is parsed
	createWarning: (modDiv, textColor, axis, customExpression) => {
		// get warning div
		var warningDiv = document.querySelector("#warning-message");

		// hide text card and show warning
		modDiv.style.display = "none";
		warningDiv.style.display = "block";
		warningDiv.innerHTML = "";

		var errorLayout = document.createElement("div");
		errorLayout.setAttribute("class", "error-layout");

		var errorContainer = document.createElement("div");
		errorContainer.setAttribute("class", "error-container");

		var errorText = document.createElement("div");
		errorText.setAttribute("class", "error-text");
		errorText.style.color = textColor;
		errorText.innerHTML =
			"ConfusionMatrix visualization is made to show unaggregated data.<br>Not selecting <strong>(Row Number)</strong> as the first measure may display aggregated data";
		errorContainer.appendChild(errorText);

		var buttonRow = document.createElement("div");
		buttonRow.setAttribute("class", "warning-row");

		var ignoreButton = document.createElement("div");
		var resetButton = document.createElement("div");

		const disableUI = function () {
			ignoreButton.onclick = null;
			resetButton.onclick = null;
			errorContainer.style.opacity = "0.5";
		};

		// create 'Ignore' button
		if (axis.parts.length > 0 && axis.parts[0].expression !== "<>" && axis.parts[0].expression !== "baserowid()") {
			ignoreButton.setAttribute("class", "spotfire-button-flex spotfire-button-white");
			var ignoreButtonText = document.createElement("div");
			ignoreButtonText.setAttribute("class", "spotfire-button-text");
			ignoreButtonText.textContent = "Keep current setting";
			ignoreButton.onclick = (e) => {
				// Allow future custom expressions
				customExpression.set(true);
				disableUI();
				e.stopPropagation();
			};
			ignoreButton.appendChild(ignoreButtonText);
			buttonRow.appendChild(ignoreButton);
		}

		// create 'Reset' button
		resetButton.setAttribute("class", "spotfire-button-flex spotfire-button-blue");
		var resetButtonText = document.createElement("div");
		resetButtonText.setAttribute("class", "spotfire-button-text");
		resetButtonText.textContent = "Use '(Row Number)'";
		resetButton.onclick = (e) => {
			// Change Card By expression to baserowid
			if (axis.parts.length == 0) {
				axis.setExpression("<baserowid()>");
			} else {
				axis.parts.unshift({ displayName: "(Row Number)", expression: "baserowid()" })
				console.log(axis.parts.map(x => { return x.displayName }));//CACA
				let newExpression = axis.parts.map(p => { return p.expression }).join(" NEST ");
				axis.setExpression(`<${newExpression}>`);
			}
			customExpression.set(false);
			disableUI();
			e.stopPropagation();
		};

		resetButton.appendChild(resetButtonText);
		buttonRow.appendChild(resetButton);

		errorContainer.appendChild(buttonRow);
		errorLayout.appendChild(errorContainer);
		warningDiv.appendChild(errorLayout);
	},

	//if everything is OK, well, clear the warning
	clearWarning: (modDiv) => {
		// get warning div
		var warningDiv = document.querySelector("#warning-message");
		warningDiv.style.display = "none";
		modDiv.style.display = "grid";
	},

	/*
	//actual and predicted input parameters are arrays of objects [{value:category1,dataViewRow:dataViewRow1},..{value:categoryN,dataViewRow:dataViewRowN}]
	//dataViewRow is the same value on both arrays
	//returns a confusion matrix but instead of the count, it returns the dataViewRow array for each cell
	//for example return object of a 3x3 confusion matrix: 
	//[
	//  [["r2"],[    ],["r1","r3"]],
	//  [[    ],[    ],[         ]],
	//  [[    ],["r0"],[         ]]
	// ] 
	// where "r2" is an actual dataViewRow
	*/
	compute: (actual, predicted) => {
		const actualCategories = actual.map(x => x.category)
		const predictedCategories = predicted.map(y => y.category)
		const categories = Array.from(new Set(actualCategories.concat(predictedCategories))).sort();

		//init square matrix
		let matrix = categories.map(() => {
			return (new Array(categories.length).fill([]))
		})

		//compute confusion matrix
		let matrixValues = {};
		for (var i = 0; i < actualCategories.length; i++) {
			var act = actualCategories[i];
			var pre = predictedCategories[i];
			var dataViewRow = predicted[i].dataViewRow;
			var actIdx = categories.indexOf(act);
			var preIdx = categories.indexOf(pre);

			//set matrixValue
			let key = [actIdx, preIdx].join()
			if (key in matrixValues) {
				matrixValues[key].dataViewRows.push(dataViewRow);
			} else {
				matrixValues[key] = {dataViewRows: [dataViewRow] };
			}
		}

		//populate matrix 
		for (const key in matrixValues) {
			let xy = key.split(",")
			let x = xy[0], y = xy[1]
			let dataViewRows = matrixValues[key].dataViewRows
			let el = { x: x, y: y, rowIds: dataViewRows, count: dataViewRows.length }
			matrix[x][y] = dataViewRows
		};

		return {
			matrix: matrix,
			categories: categories
		};
	},

	/*
	//actual and predicted input parameters are arrays of objects [{value:category1,dataViewRow:dataViewRow1},..{value:categoryN,dataViewRow:dataViewRowN}]
	//dataViewRow is the same value on both arrays
	//returns a confusion matrix object from the same input parameters as this.compute
	//[
	//  [1,0,2],
	//  [0,0,0],
	//  [0,1,0]
	// ] 
	*/
	compute2: (arr1, arr2) => {
		let actual = arr1.map(x => x.category)
		let predicted = arr2.map(y => y.category)
		var categories = Array.from(new Set(actual.concat(predicted))).sort();
		var matrix = [];
		for (var i = 0; i < categories.length; i++) {
			matrix.push(new Array(categories.length).fill(0));
		}
		for (var i = 0; i < actual.length; i++) {
			var act = actual[i];
			var pre = predicted[i];
			var actIndex = categories.indexOf(act);
			var preIndex = categories.indexOf(pre);
			matrix[actIndex][preIndex]++;
		}
		return {
			matrix: matrix,
			categories: categories
		};
	},



	//draws a confusion matrix array defined in options.data
	/*font info
	styling.general
						.font.fontWeight 
				.scales.font.fontStyle 
				.scales.font.fontSize
				.scales.font.fontFamily
				.scales.font.color
	*/
	draw: function (options, styling) {

		//need to compute left and bottom margins depending on labels
		//TODO

		let minMax = getMinMax(options.data)

		let margin = { top: 5, right: 5, bottom: 50, left: 50 },
			width = options.width - 80,    //TODO cut vertical labels width
			height = options.height - 100, //TODO cut text height
			data = options.data,
			container = options.container,
			labelsData = options.labels,
			numrows = data.length, 
			numcols = data[0].length,
			minColor = options.maxColor,
			maxColor = options.minColor,
			showValues = options.showValues,
			showLabels = options.showLabels,
			showZeros = options.showZeros,
			min = minMax[0],
			max = minMax[1];

			// data = options.data.map(x=>x.map(x=>x.length));
			// let data2 = options.data;


		/*	TODO show error layer but check before calling funciton
			if(!data) throw new Error('No data passed.');
			if(!Array.isArray(data) || !data.length || !Array.isArray(data[0])){
				throw new Error('Data type should be two-dimensional Array.');
			}*/

		//clear
		d3.select(container).html("");

		//svg
		var svg = d3.select(container).append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var background = svg.append("rect")
			.style("stroke", styling.scales.line.stroke)
			.style("stroke-width", "2px")
			.attr("width", width)
			.attr("height", height);


		var x = d3.scale.ordinal()
			.domain(d3.range(numcols))
			.rangeBands([0, width]);

		var y = d3.scale.ordinal()
			.domain(d3.range(numrows))
			.rangeBands([0, height]);

		var colorMap = d3.scale.linear()
			.domain([min, max])
			.range([minColor, maxColor]); //box  fill

		var row = svg.selectAll(".row")
			.data(data)
			.enter().append("g")
			.attr("class", "row")
			.attr("transform", function (d, i) {return "translate(0," + y(i) + ")"; });

		var cell = row.selectAll(".cell")
			// .data(function (d,i) { return d})
			// .data(function (d,i) { return d.map(x=>x.length);})
			.data(function (d,i) { return d})
			.enter().append("g")
			.attr("class", "cell")
			.attr("transform", function (d, i) { return "translate(" + x(i) + ", 0)"; })
			.on("mouseover", (d,x,y) => { console.log(d, x, y, cell, row[0][x], data[x][y]) })
			.on("mouseout", () => { });

		cell.append('rect')
			.attr("width", x.rangeBand())
			.attr("height", y.rangeBand())
			.style("stroke-width", 0);

		if (showValues) cell.append("text")
			.attr("dy", ".32em")
			.attr("x", x.rangeBand() / 2)
			.attr("y", y.rangeBand() / 2)
			.attr("text-anchor", "middle")
			// .style("fill", function (d, i) { return d >= 0.5 ? 'white' : 'black'; }) //this one is good if the confusion matrix scale is from 0 to 1 to display accuracy
			.style("fill", styling.general.font.color)
			.text(function (d, i) { return showZeros ? d ? d : "" : d });

		row.selectAll(".cell")
			.data(function (d, i) { return data[i]; })
			.style("fill", colorMap);

		var labels = svg.append('g')
			.attr('class', "labels");

		var columnLabels = labels.selectAll(".column-label")
			.data(labelsData)
			.enter().append("g")
			.attr("class", "column-label")
			.attr("transform", function (d, i) { return "translate(" + x(i) + "," + height + ")"; });

		columnLabels.append("line")
			.style("stroke", styling.scales.tick.stroke)
			.style("stroke-width", "1px")
			.attr("x1", x.rangeBand() / 2)
			.attr("x2", x.rangeBand() / 2)
			.attr("y1", 0)
			.attr("y2", 5);

		columnLabels.append("text")
			.attr("x", 6)
			.attr("y", y.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "end")
			.style("fill", styling.scales.font.color)
			.style("font-family", styling.scales.font.fontFamily)
			.style("font-size", styling.scales.font.fontSize)
			.style("font-weight", styling.scales.font.fontWeight)
			// .attr("transform", function (d, i) { return "translate(" + 0 + "," + 15 + ")rotate(-00)"; })
			.attr('transform', 'translate(2,15)rotate(-90)')

			// .attr("transform", "translate(35,-5)") //===== vertical | horizontal 
			.text(function (d, i) { return d; });

		var rowLabels = labels.selectAll(".row-label")
			.data(labelsData)
			.enter().append("g")
			.attr("class", "row-label")
			.attr("transform", function (d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

		rowLabels.append("line")
			.style("stroke", styling.scales.tick.stroke)
			.style("stroke-width", "1px")
			.attr("x1", 0)
			.attr("x2", -5)
			.attr("y1", y.rangeBand() / 2)
			.attr("y2", y.rangeBand() / 2);

		rowLabels.append("text")
			.attr("x", -8)
			.attr("y", y.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "end")
			.style("fill", styling.scales.font.color)
			.style("font-family", styling.scales.font.fontFamily)
			.style("font-size", styling.scales.font.fontSize)
			.style("font-weight", styling.scales.font.fontWeight)
			.text(function (d, i) { if (showLabels) return d; });

		function mouseover(p) {
			d3.selectAll(".row text").classed("active", function (d, i) { return i == p.y; });
			d3.selectAll(".column text").classed("active", function (d, i) { return i == p.x; });
		}

	},

	//settings dialog
	settings: {

		chartSettings: () => {
			return {
				color1: document.getElementById("color1").value,
				color2: document.getElementById("color2").value,
				showLabels: document.getElementById("showLabels").checked,
				showValues: document.getElementById("showValues").checked,
				showZeros: document.getElementById("showZeros").checked
			}
		},

		//this is the function that I don't know how to pass the modSettings mod property so when it changes, it re-render the mod
		//I tried passing the mod, and modSettings readable properties.
		//IGNORE THIS FUNCTION, the same functionality is on main.js.initSettings
		init: (mod) => { },

		close: function () {
			document.getElementById('configDialog').hidden = true
		}

	}
}

