export const sleep = (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const readArrayBuffer = (blob: Blob) => {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve((e.target as any).result);
    };

    reader.readAsArrayBuffer(blob);
  });
};

export const readText = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve((e.target as any).result);
    };

    reader.readAsText(blob);
  });
};
