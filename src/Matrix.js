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
				// console.log(axis.parts.map(x => { return x.displayName }));//CACA
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
	compute: (actual, predicted, isSorted) => {
		const actualCategories = actual.map(x => x.category)
		const predictedCategories = predicted.map(y => y.category)
		const categories = Array.from(new Set(actualCategories.concat(predictedCategories)))
		if (isSorted) categories.sort();

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
				matrixValues[key] = { dataViewRows: [dataViewRow] };
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

	//draws a confusion matrix array defined in options.data
	/*font info
	styling.general
				.font.fontWeight 
				.scales.font.fontStyle 
				.scales.font.fontSize
				.scales.font.fontFamily
				.scales.font.color
	*/
	draw: function (options, styling, tooltip) {

		//need to compute left and bottom margins depending on labels
		//TODO

		let counts = options.data.map(x => x.map(x => x.length));
		let minMax = getMinMax(counts)

		let margin = { top: 5, right: 5, bottom: 80, left: 80 },
			width = options.width - 50,    //TODO cut vertical labels width
			height = options.height - 50, //TODO cut text height
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

		//outer box
		var background = svg.append("rect")
			.style("stroke", styling.scales.line.stroke)
			.style("stroke-width", "2px")
			.attr("width", width)
			.attr("height", height);

		//columns
		var x = d3.scale.ordinal()
			.domain(d3.range(numcols))
			.rangeBands([0, width]);

		//rows
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
			.attr("transform", function (d, i) { return "translate(0," + y(i) + ")"; });

		var cell = row.selectAll(".cell")
			.data(function (d, i) { return d.map(x => x.length) })
			.enter().append("g")
			.attr("class", "cell")
			.attr("transform", function (d, i) { return "translate(" + x(i) + ", 0)"; })
			.on("mouseover", (val, y, x) => {
				if (!val) return; //no data for zero count
				if (!true) { //test oob tooltip (can't show cell value, so we use custom method, which is data[x][y].length)
					tooltip.show(data[x][y][0]) 
				} else {
					let dvr = data[x][y][0]
					let tt = "Count:\t\t" + val + "\n"
					tt += "Actual:\t\t" + (dvr.categorical("Actual").formattedValue()) + "\n"
					tt += "Predicted:\t" + (dvr.categorical("Predicted").formattedValue())
					tooltip.show(tt) //use custom tooltips that shows not only categories, but cell value (TODO)
				}
			})
			.on("mouseout", () => { tooltip.hide() });


			//horizontal grid lines
		cell.append('rect')
			.attr("width", x.rangeBand())
			.attr("height", y.rangeBand())
			.style("stroke", styling.scales.line.stroke) 

		// show values	
		if (showValues) cell.append("text")
			.attr("dy", ".32em")
			.attr("x", x.rangeBand() / 2)
			.attr("y", y.rangeBand() / 2)
			.attr("text-anchor", "middle")
			// .style("fill", function (d, i) { return d >= 0.5 ? 'white' : 'black'; }) //this one is good if the confusion matrix scale is from 0 to 1 to display accuracy
			.style("fill", function(d,i){return Colors.bestContrastColor(colorMap(i),styling.general.font.color)})
			.text(function (d, i) { return showZeros ? d ? d : "" : d });

		//colorize cells
		row.selectAll(".cell")
			.data(function (d, i) {return counts[i]; })
			.style("fill", function(d,i){return d>0?colorMap(i):styling.general.backgroundColor});

		var labels = svg.append('g')
			.attr('class', "labels")
			.style("display", showLabels ? 'block' : 'none')

		var columnLabels = labels.selectAll(".column-label")
			.data(labelsData)
			.enter().append("g")
			.attr("class", "column-label")
			.attr("transform", function (d, i) { return "translate(" + x(i) + "," + height + ")"; });

		//x ticks
		columnLabels.append("line")
			.style("stroke", styling.scales.tick.stroke)  //ticks
			.style("stroke-width", "1px")
			.attr("x1", x.rangeBand() / 2)
			.attr("x2", x.rangeBand() / 2)
			.attr("y1", 0)
			.attr("y2", 5); //5

		let cellWidth = d3.select(".row .cell rect").attr("width");
		let cellHeight = d3.select(".row .cell rect").attr("height");

		//x labels
		columnLabels.append("text")
		.attr("x", 0 )
		// .attr("y", y.rangeBand() / 2 )
		.style("text-anchor", "left")
		.style("fill", styling.scales.font.color)
		.style("font-family", styling.scales.font.fontFamily)
		.style("font-size", styling.scales.font.fontSize)
		.style("font-weight", styling.scales.font.fontWeight)
		// .attr("transform", `translate(0, ${-y.rangeBand() / 2}) rotate(-90)`)
		.text(function (d, i) { return d; })
		.on("mouseover", (text, row) => { tooltip.show(text) })
		.on("mouseout", tooltip.hide)
		.each(function () { ellipsis(d3.select(this), cellWidth) })
		.each(function () { 
			self = d3.select(this);
			//center
			var textLength = self.node().getComputedTextLength();
			self.attr("x",(cellWidth-textLength)/2)

			//margin top 1/2 font height
			txtHeight = self.node().getBoundingClientRect().height;
			self.attr("y",y.rangeBand()/4 + txtHeight/2);

		});

		var rowLabels = labels.selectAll(".row-label")
			.data(labelsData)
			.enter().append("g")
			.attr("class", "row-label")
			.attr("transform", function (d, i) { return "translate(" + 10 + "," + y(i) + ")"; });

		//y ticks
		rowLabels.append("line")
			.style("stroke", styling.scales.tick.stroke) 
			.style("stroke-width", "1px")
			.attr("x1", -10)
			.attr("x2", -15)
			.attr("y1", y.rangeBand() / 2)
			.attr("y2", y.rangeBand() / 2);

		//y labels
		rowLabels.append("text")

			.attr("x", -25)
			.attr("text-anchor", "end") //start|end|middle
			.style("fill", styling.scales.font.color)
			.style("font-family", styling.scales.font.fontFamily)
			.style("font-size", styling.scales.font.fontSize)
			.style("font-weight", styling.scales.font.fontWeight)
			.style("cursor", "default")
			.text(function (d, i) { return d; })
			.on("mouseover", (text, row) => { tooltip.show(text) })
			.on("mouseout", tooltip.hide)
			.each(function () { ellipsis(d3.select(this), margin.left) })
			.each(function () { 
				self = d3.select(this);
				txtHeight = self.node().getBoundingClientRect().height;
				self.attr("y",y.rangeBand()/2 + txtHeight/4);
			});
	



		//helper function to add overflowing text (like css text-overflow:ellipsis)
		function ellipsis(self, width) {
			
			var textLength = self.node().getComputedTextLength(),
				text = self.text();

			// while (textLength > (width - 2 * padding) && text.length > 0) {
			while (textLength > (width - 10) && text.length > 0) {
				text = text.slice(0, -1);
				self.text(text + '...');
				textLength = self.node().getComputedTextLength();
			}
		}

		//another vresion of the ellipsis



		//maybe this function can highlight related data, but...how to highlight data?
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
				showZeros: document.getElementById("showZeros").checked,
				isSorted: document.getElementById("isSorted").checked
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

