//draws d3 matrix


//not used yet. Maybe for tooltips. Returns the matrix accuracy


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

	metrics: (cm) => {
		let tp = 0,
			fn = 0,
			fp = 0,
			tn = 0,
			macroPrecision = 0,
			macroRecall = 0,
			macroF1Score = 0;
		let numClasses = cm.length;
		let classMetrics = [];

		for (let i = 0; i < numClasses; i++) {
			for (let j = 0; j < numClasses; j++) {
				if (i === j) {
					tp = cm[i][j];
				} else {
					fn += cm[i][j];
					fp += cm[j][i];
				}
			}

			let precision = tp / (tp + fp);
			let recall = tp / (tp + fn);
			let f1Score = 2 * ((precision * recall) / (precision + recall));

			if (isNaN(precision)) precision = 0;
			if (isNaN(recall)) recall = 0;
			if (isNaN(f1Score)) f1Score = 0;

			macroPrecision += precision;
			macroRecall += recall;
			macroF1Score += f1Score;

			classMetrics.push({
				precision,
				recall,
				f1Score,
			});

			tp = 0;
			fn = 0;
			fp = 0;
		}

		macroPrecision /= numClasses;
		macroRecall /= numClasses;
		macroF1Score /= numClasses;

		if (isNaN(macroPrecision)) macroPrecision = 0;
		if (isNaN(macroRecall)) macroRecall = 0;
		if (isNaN(macroF1Score)) macroF1Score = 0;

		return {
			macroPrecision,
			macroRecall,
			macroF1Score,
			classMetrics,
		};
	},


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
			"ConfusionMatrix visualization is made to show unaggregated data.<br>Not selecting <strong>(Row Number)</strong> as the first measure may display aggregated data<p> You can change this setting later from the Group By Axis found in the visualization properties";
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
		let matrixData = categories.map(() => {
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
			matrixData[x][y] = dataViewRows
		};

		let counts = matrixData.map(x => x.map(x => x.length));
		matrixData.counts = counts;

		return {
			data: matrixData,
			counts: counts,
			minMax: getMinMax(counts),
			categories: categories,
			metrics: ConfusionMatrix.metrics(matrixData.counts)
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
	draw: function (options, styling, tooltip, markingInfo) {

		//need to compute left and bottom margins depending on labels
		//TODO

		// let counts = options.matrix.data.map(x => x.map(x => x.length));


		let margin = { top: 25, right: 5, bottom: 80, left: 80 },
			width = options.width - 80,
			height = options.height - 70,
			data = options.matrix.data,
			container = options.container,
			labelsData = options.labels,
			numrows = data.length,
			numcols = data[0].length,
			maxColor = options.minColor,
			minColor = options.maxColor,
			showValues = options.showValues,
			showLabels = options.showLabels,
			showZeros = options.showZeros,
			counts = options.matrix.counts,
			min = options.matrix.minMax[0],
			max = options.matrix.minMax[1],
			metrics = options.matrix.metrics;




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

		var colorScale = d3.scale.linear()
			.domain([min, max])
			.range([minColor, maxColor]); //box  fill

		var row = svg.selectAll(".row")
			.data(data)
			.enter().append("g")
			.attr("class", "row")
			.attr("transform", function (d, i) { return "translate(0," + y(i) + ")"; });

		var markRows = function(dvRows2mark){
				//determine marking operation
				//MarkingOperation: "Replace" | "Add" | "Subtract" | "Toggle" | "Intersect" | "ToggleOrAdd"
				let markingOperation = null
				if (d3.event.ctrlKey) markingOperation = "Toggle"
				dvRows2mark.forEach(r=>{r.mark(markingOperation)});
		}

		var cell = row.selectAll(".cell")
			.data(function (d, i) { return d.map(x => x.length) })
			.enter().append("g")
			.attr("class", (val,x,y)=>{
				if (!data[y][x].some(r=>r.isMarked())) return "cell";
			})
			.style("fill", function (val,x,y) { 
				//return styling.general.font.color 
				if (data[y][x].some(r=>r.isMarked())) return markingInfo.colorHexCode;
		   })

			
			.on("click",(val,x,y)=>{markRows(data[y][x])})

			.attr("transform", function (d, i) { return "translate(" + x(i) + ", 0)"; })

			
			.on("mouseover", (val, y, x) => {
				if (!val) return; //no data for zero count
				if (!true) { //test oob tooltip (can't show cell value, so we use custom method, which is data[x][y].length)
					tooltip.show(data[x][y][0])
				} else {
					let dvr = data[x][y][0]
					let actual = (dvr.categorical("Actual").formattedValue())
					let predicted = (dvr.categorical("Predicted").formattedValue())
					let tt = "Count:\t\t" + val + "\n"
					tt += "Actual:\t\t" + actual + "\n";
					tt += "Predicted:\t" + predicted;
					if(actual==predicted){
					tt += "\nPrecision:\t" + metrics.classMetrics[x].precision.toFixed(3);
					tt += "\nRecall:\t\t" + metrics.classMetrics[x].recall.toFixed(3);
					tt += "\nF1 Score:\t" + metrics.classMetrics[x].f1Score.toFixed(3);
					}
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
			//  .style("fill", function (d, i) { return d >= 0.5 ? 'white' : 'black'; }) //this one is good if the confusion matrix scale is from 0 to 1 to display accuracy
			.style("fill", function (d, x,y) { 
				 //return styling.general.font.color 
				 //background could be the marking color or the cell color
				 isMarked = data[y][x].some(r=>r.isMarked());
				 let background = isMarked?colorScale(d):markingInfo.colorHexCode;
				 if (isMarked) return Colors.bestContrastColor(background,styling.general.font.color);
				 return Colors.getContrastingTextColor(background, styling.general.font.color,100);
			})
			.text(function (d, i) { return showZeros ? d ? d : "" : d });


		//colorize cells
		row.selectAll(".cell")
			// .data(function (d, i) { return counts[i]; })
			.style("fill", function (d,i,j) {
				 return d > 0 ? colorScale(d) :styling.general.backgroundColor 
			});

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
			.attr("x", 0)
			// .attr("y", y.rangeBand() / 2 )
			.style("text-anchor", "left")
			.style("fill", styling.scales.font.color)
			.style("font-family", styling.scales.font.fontFamily)
			.style("font-size", styling.scales.font.fontSize)
			.style("font-weight", styling.scales.font.fontWeight)
			// .attr("transform", `translate(0, ${-y.rangeBand() / 2}) rotate(-90)`)
			.text(function (d, i) { return d; })
			.on("mouseover", (text, row) => { tooltip.show(text) })
			.on("click",(val,x,y)=>{ 
				if (d3.event.altKey) {markRows(data[x][x])}
				else {
					let rows=[]
					for(i=0;i<numcols;i++){
						if(data[i][x].length) rows.push(data[i][x])
					}
					markRows(rows.flat());
				}
			})
			.on("mouseout", tooltip.hide)
			.each(function () { ellipsis(d3.select(this), cellWidth) })
			.each(function () {
				self = d3.select(this);
				//center
				var textLength = self.node().getComputedTextLength();
				self.attr("x", (cellWidth - textLength) / 2)

				//margin top 1/2 font height
				txtHeight = self.node().getBoundingClientRect().height;
				self.attr("y", y.rangeBand() / 4 + txtHeight / 2);

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
			.on("click",(val,x,y)=>{ 
				if (d3.event.altKey) {markRows(data[x][x])}
				else {
					let rows=[]
					for(i=0;i<numcols;i++){
						if(data[x][i].length) rows.push(data[x][i])
					}
					markRows(rows.flat());
				}
			})
			.each(function () { ellipsis(d3.select(this), margin.left) })
			.each(function () {
				self = d3.select(this);
				txtHeight = self.node().getBoundingClientRect().height;
				self.attr("y", y.rangeBand() / 2 + txtHeight / 4);
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

	renderMetrics: (metrics,labels) => {

		let table = document.createElement("table");
		let thead = document.createElement("thead");
		table.id = "confusionMatrixMatrixTable"
		table.appendChild(thead);
		let headers = ["Class", "Precision", "Recall", "F1 Score"];
		let headerRow = document.createElement("tr");


		headers.forEach(function (header) {
			let headerCell = document.createElement("th");
			headerCell.innerHTML = header;
			headerRow.appendChild(headerCell);
		});

		thead.appendChild(headerRow);

		metrics.classMetrics.forEach(function (classMetric, index) {
			let row = document.createElement("tr");
			let classCell = document.createElement("td");
			classCell.innerHTML = labels[index];
			row.appendChild(classCell);

			let precisionCell = document.createElement("td");
			precisionCell.innerHTML = classMetric.precision.toFixed(3);
			row.appendChild(precisionCell);

			let recallCell = document.createElement("td");
			recallCell.innerHTML = classMetric.recall.toFixed(3);
			row.appendChild(recallCell);

			let f1ScoreCell = document.createElement("td");
			f1ScoreCell.innerHTML = classMetric.f1Score.toFixed(3);
			row.appendChild(f1ScoreCell);

			table.appendChild(row);

		});
		//add macroMetrix (macro Presicion, Macro Recall & Macro F1 Score AKA Total Class Averages)
		let macroMetrix = `<th>Average</th>
			<th>${metrics.macroPrecision.toFixed(3)}</th>
			<th>${metrics.macroRecall.toFixed(3)}</th>
			<th>${metrics.macroF1Score.toFixed(3)}</th>`
		row = document.createElement("tr");
		row.style.borderTop="1px solid whitesmoke";
		row.innerHTML = macroMetrix;
		table.appendChild(row);

		let metricsContainer = document.querySelector(".metricsContainer");
		metricsContainer.innerHTML = "";
		metricsContainer.appendChild(table);

		// TableTools.makeColumnsResizable(table.id); 

		//make columns sortable on click (TODO)
		// TableTools.sortTable(table.id,1,"asc")
		// TableTools.sortTable(table.id,1,"desc")
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
				isSorted: document.getElementById("isSorted").checked,
				showMetrics: document.getElementById("showMetrics").checked
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

