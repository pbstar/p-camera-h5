export const downloadFile = (file: File) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
// base64 to file
export const base64ToFile = (base64: string, ext: string) => {
  const arr: any = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], `pCameraH5-${Date.now()}.${ext}`, { type: mime });
};
// blob to file
export const blobToFile = (blob: Blob, ext: string) => {
  return new File([blob], `pCameraH5-${Date.now()}.${ext}`, {
    type: blob.type,
  });
};
