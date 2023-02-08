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
    getBrightness: function(color) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    },
  
    isSimilar: function(color1, color2, tolerance) {
      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);
      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);
      const diff = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
      return diff / Math.sqrt(255 ** 2 * 3) <= tolerance;
    },
  
    bestContrastColor: function(backgroundColor, textColor) {
      if (this.isSimilar(backgroundColor, textColor, .3)) {
        const backgroundColorBrightness = this.getBrightness(backgroundColor);
        return backgroundColorBrightness > 0.7 ? "#000000" : "#ffffff";
      }
      return textColor;
    }
  };