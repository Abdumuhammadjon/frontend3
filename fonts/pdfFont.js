 import font from "@/fonts/NotoSans-Regular";

export const registerNotoSans = (doc) => {
  doc.addFileToVFS("NotoSans-Regular.ttf", font);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
};
