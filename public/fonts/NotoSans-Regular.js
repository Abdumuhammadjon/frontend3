

import { jsPDF } from "jspdf"
var font = 'undefined';
var callAddFont = function () {
this.addFileToVFS('NotoSans-Regular-normal.ttf', font);
this.addFont('NotoSans-Regular-normal.ttf', 'NotoSans-Regular', 'normal');
};
jsPDF.API.events.push(['addFonts', callAddFont])