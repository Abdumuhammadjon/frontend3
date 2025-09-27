 var callAddFont = function () {
  this.addFileToVFS('NotoSans-Regular-normal.ttf', 'AAEAAAQUAQAABAARORFRTAnyTOAAJYAAGkQdQTIMGCcZAALF0AAB2SBHULVCVF1gQtAbgEAARz4T1MvMo...'); // To'liq base64 kodini bu yerga qo'ying
  this.addFont('NotoSans-Regular-normal.ttf', 'NotoSans-Regular', 'normal');
};
jsPDF.API.callAddFont = callAddFont; // Bu qatorni ishlatish