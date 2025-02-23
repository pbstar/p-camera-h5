export const downloadFile = (file: File, name?: string) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = name ? name : file.name;
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
export const deepMerge = (...sources: any[]) => {
  const result: any = {};

  function isPlainObject(item: any) {
    return (
      item !== null &&
      typeof item === "object" &&
      Object.prototype.toString.call(item) === "[object Object]"
    );
  }

  sources.forEach((source) => {
    if (isPlainObject(source)) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const sourceValue = source[key];
          const targetValue = result[key];

          if (isPlainObject(sourceValue)) {
            // 递归合并子对象
            if (!isPlainObject(targetValue)) {
              result[key] = {};
            }
            result[key] = deepMerge(targetValue, sourceValue);
          } else if (Array.isArray(sourceValue)) {
            // 数组处理：直接覆盖（可根据需求改为合并）
            result[key] = [...sourceValue];
          } else {
            // 基础类型或其他对象（如 Date）直接赋值
            result[key] = sourceValue;
          }
        }
      }
    }
  });

  return result;
};
