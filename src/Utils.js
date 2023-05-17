//helper class to find the best color for a given color
//usage: const c = new Color("#333333") //dark gray for background
//       c.bestContrastColor("#222222") //returns a #ffffff since the background and text are too similar
//usage shortcut: c = (new Color("#333333")).bestContrastColor("#222222") //returns #ffffff because it contrast best with #333333
class Color {
  constructor(color) {
    this.color = color;
  }

  getBrightness() {
    const r = parseInt(this.color.substring(1, 3), 16);
    const g = parseInt(this.color.substring(3, 5), 16);
    const b = parseInt(this.color.substring(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  }

  isSimilar(otherColor, tolerance) {
    const r1 = parseInt(this.color.substring(1, 3), 16);
    const g1 = parseInt(this.color.substring(3, 5), 16);
    const b1 = parseInt(this.color.substring(5, 7), 16);
    const r2 = parseInt(otherColor.substring(1, 3), 16);
    const g2 = parseInt(otherColor.substring(3, 5), 16);
    const b2 = parseInt(otherColor.substring(5, 7), 16);
    const diff = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    return diff / Math.sqrt(255 ** 2 * 3) <= tolerance;
  }

  bestContrastColor(otherColor) {
    if (this.isSimilar(otherColor, 0.3)) {
      const backgroundColorBrightness = this.getBrightness();
      return backgroundColorBrightness > 0.7 ? "#000000" : "#ffffff";
    }
    return otherColor;
  }
}

//as a bundled JSON object
const Colors = {
  getBrightness: function (color) { return color;
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  },

  isSimilar: function (color1, color2, tolerance) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    const diff = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    return diff / Math.sqrt(255 ** 2 * 3) <= tolerance;
  },

  bestContrastColor: function (backgroundColor, textColor) {
     //if (this.isSimilar(backgroundColor, textColor, .3)) {
      const backgroundColorBrightness = this.getBrightness(backgroundColor);
      return backgroundColorBrightness > 0.5 ? "#000000" : "#ffffff";
     //}
    return textColor;
  },


  getContrastingTextColor: function(background, text, threshold) {
  // Function to calculate color difference
  function colorDifference(color1, color2) {
    var lab1 = d3.lab(color1);
    var lab2 = d3.lab(color2);
    var diff = Math.sqrt(
      Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
    );
    return diff;
  }

  // Calculate the color difference between the text color and the background color
  var diff = colorDifference(d3.rgb(text), d3.rgb(background));

  // Check if the color difference is below the threshold
  if (diff < threshold) {
    // Fallback to black or white based on the luminance of the background color
    var luminance = d3.lab(background).l;
    return luminance > 60 ? "black" : "white";
  } else {
    // Use the provided text color
    return text;
  }
  }}
  


//not used
const TableTools = {

  makeColumnsResizable: (tableId) => {
    let table = document.getElementById(tableId);
    let headers = table.getElementsByTagName("th");
    let thead = table.firstElementChild;
    let resizerHeight = getComputedStyle(thead).height

    for (let i = 0; i < headers.length; i++) {
      let header = headers[i];
      let resizer = document.createElement("span");

      resizer.style.width = "5px";
      resizer.style.height = resizerHeight;
      resizer.style.right = "0px";
      resizer.style.top = "0px";
      resizer.style.float = "right";
      // resizer.style.background = "red";
      resizer.style.cursor = "ew-resize";
      resizer.style.userSelect = "none";
      resizer.style.right = 0;

      header.appendChild(resizer);

      let isResizing = false;
      let startX, startWidth;

      resizer.addEventListener("mousedown", function (e) {
        isResizing = true;
        startX = e.pageX;
        startWidth = header.offsetWidth;
        header.style.pointerEvents = "none";
      });

      document.addEventListener("mousemove", function (e) {
        if (!isResizing) return;
        header.style.width = startWidth + (e.pageX - startX) + "px";
      });

      document.addEventListener("mouseup", function (e) {
        isResizing = false;
        header.style.pointerEvents = "auto";
      });

    }
  },

  sortTable: (tableId, colIndex, sortOrder) => {
    let table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById(tableId);
    switching = true;
    // Set the sorting direction to ascending or descending
    dir = (sortOrder === "asc") ? 1 : (sortOrder === "desc") ? -1 : 0;
    // Make a loop that will continue until no switching has been done:
    while (switching) {
      switching = false;
      rows = table.rows;
      // Loop through all table rows (except the first, which contains table headers):
      for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;
        // Get the two elements you want to compare, one from current row and one from the next:
        x = rows[i].getElementsByTagName("TD")[colIndex];
        y = rows[i + 1].getElementsByTagName("TD")[colIndex];
        // Check if the two rows should switch place, based on the direction, asc or desc:
        if (dir === 1) {
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            shouldSwitch = true;
            break;
          }
        } else if (dir === -1) {
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            shouldSwitch = true;
            break;
          }
        } else if (dir === 0) {
          if (x.innerHTML.localeCompare(y.innerHTML) === 1) {
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        // If a switch has been marked, make the switch and mark that a switch has been done:
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        // Each time a switch is done, increase this count by 1:
        switchcount++;
      } else {
        // If no switching has been done AND the direction is "asc", set the direction to "desc" and run the while loop again.
        if (switchcount === 0 && sortOrder === "asc") {
          sortOrder = "desc";
          switching = true;
        }
      }
    }
  }
}