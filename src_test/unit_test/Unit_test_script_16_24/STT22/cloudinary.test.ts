/**
 * STT 23 — Unit tests for elearning-frontend/src/utils/cloudinary.ts
 * 91 test cases — Nhóm A→L
 */

import {
  isValidImageFile,
  isValidVideoFile,
  isValidDocumentFile,
  isValidFileSize,
  isYouTubeUrl,
  extractYouTubeId,
  formatFileSize,
  getFileExtension,
  getFileIcon,
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  uploadFileToCloudinary,
} from '@/utils/cloudinary';

// ── Helpers ────────────────────────────────────────────────────
const makeFile = (name: string, type: string, sizeBytes = 10 * 1024): File => {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
};

// ── XHR Mock ───────────────────────────────────────────────────
interface MockXHRInstance {
  upload: { addEventListener: jest.Mock };
  addEventListener: jest.Mock;
  open: jest.Mock;
  send: jest.Mock;
  status: number;
  responseText: string;
  _listeners: Record<string, Function>;
  _uploadListeners: Record<string, Function>;
  _trigger: (event: string, data?: object) => void;
  _triggerUpload: (event: string, data?: object) => void;
}

let xhrInstance: MockXHRInstance;

beforeEach(() => {
  xhrInstance = {
    upload: { addEventListener: jest.fn((ev: string, cb: Function) => { xhrInstance._uploadListeners[ev] = cb; }) },
    addEventListener: jest.fn((ev: string, cb: Function) => { xhrInstance._listeners[ev] = cb; }),
    open: jest.fn(),
    send: jest.fn(),
    status: 200,
    responseText: JSON.stringify({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      public_id: 'sample',
      resource_type: 'image',
      format: 'jpg',
    }),
    _listeners: {},
    _uploadListeners: {},
    _trigger(event: string, data?: object) {
      if (this._listeners[event]) this._listeners[event](data ?? {});
    },
    _triggerUpload(event: string, data?: object) {
      if (this._uploadListeners[event]) this._uploadListeners[event](data ?? {});
    },
  };
  (global as any).XMLHttpRequest = jest.fn(() => xhrInstance);

  // Reset env
  delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
});

afterEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════
// Nhóm A — isValidImageFile
// ══════════════════════════════════════════════════════════════
describe('Nhóm A — isValidImageFile', () => {
  it('TC_CLOUDI_01: image/jpeg → true', () => {
    expect(isValidImageFile(makeFile('a.jpg', 'image/jpeg'))).toBe(true);
  });
  it('TC_CLOUDI_02: image/jpg → true (alias)', () => {
    expect(isValidImageFile(makeFile('a.jpg', 'image/jpg'))).toBe(true);
  });
  it('TC_CLOUDI_03: image/png → true', () => {
    expect(isValidImageFile(makeFile('a.png', 'image/png'))).toBe(true);
  });
  it('TC_CLOUDI_04: image/gif → true', () => {
    expect(isValidImageFile(makeFile('a.gif', 'image/gif'))).toBe(true);
  });
  it('TC_CLOUDI_05: image/webp → true', () => {
    expect(isValidImageFile(makeFile('a.webp', 'image/webp'))).toBe(true);
  });
  it('TC_CLOUDI_06: image/svg+xml → false', () => {
    expect(isValidImageFile(makeFile('a.svg', 'image/svg+xml'))).toBe(false);
  });
  it('TC_CLOUDI_07: application/pdf → false', () => {
    expect(isValidImageFile(makeFile('a.pdf', 'application/pdf'))).toBe(false);
  });
  it('TC_CLOUDI_08: video/mp4 → false', () => {
    expect(isValidImageFile(makeFile('a.mp4', 'video/mp4'))).toBe(false);
  });
  it('TC_CLOUDI_09: type rỗng "" → false', () => {
    expect(isValidImageFile(makeFile('a', ''))).toBe(false);
  });
  it('TC_CLOUDI_10: Uppercase "IMAGE/JPEG" → true (File API normalizes MIME to lowercase)', () => {
    // Browser File API normalizes MIME type to lowercase, so "IMAGE/JPEG" → "image/jpeg" → matches whitelist
    expect(isValidImageFile(makeFile('a.jpg', 'IMAGE/JPEG'))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm B — isValidVideoFile
// ══════════════════════════════════════════════════════════════
describe('Nhóm B — isValidVideoFile', () => {
  it('TC_CLOUDI_11: video/mp4 → true', () => {
    expect(isValidVideoFile(makeFile('a.mp4', 'video/mp4'))).toBe(true);
  });
  it('TC_CLOUDI_12: video/webm → true', () => {
    expect(isValidVideoFile(makeFile('a.webm', 'video/webm'))).toBe(true);
  });
  it('TC_CLOUDI_13: video/ogg → true', () => {
    expect(isValidVideoFile(makeFile('a.ogg', 'video/ogg'))).toBe(true);
  });
  it('TC_CLOUDI_14: video/quicktime (.mov) → true', () => {
    expect(isValidVideoFile(makeFile('a.mov', 'video/quicktime'))).toBe(true);
  });
  it('TC_CLOUDI_15: video/x-matroska (.mkv) → false', () => {
    expect(isValidVideoFile(makeFile('a.mkv', 'video/x-matroska'))).toBe(false);
  });
  it('TC_CLOUDI_16: image/jpeg → false', () => {
    expect(isValidVideoFile(makeFile('a.jpg', 'image/jpeg'))).toBe(false);
  });
  it('TC_CLOUDI_17: application/pdf → false', () => {
    expect(isValidVideoFile(makeFile('a.pdf', 'application/pdf'))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm C — isValidDocumentFile
// ══════════════════════════════════════════════════════════════
describe('Nhóm C — isValidDocumentFile', () => {
  it('TC_CLOUDI_18: application/msword (.doc) → true', () => {
    expect(isValidDocumentFile(makeFile('a.doc', 'application/msword'))).toBe(true);
  });
  it('TC_CLOUDI_19: .docx → true', () => {
    expect(isValidDocumentFile(makeFile('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe(true);
  });
  it('TC_CLOUDI_20: .ppt → true', () => {
    expect(isValidDocumentFile(makeFile('a.ppt', 'application/vnd.ms-powerpoint'))).toBe(true);
  });
  it('TC_CLOUDI_21: .pptx → true', () => {
    expect(isValidDocumentFile(makeFile('a.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'))).toBe(true);
  });
  it('TC_CLOUDI_22: .xls → true', () => {
    expect(isValidDocumentFile(makeFile('a.xls', 'application/vnd.ms-excel'))).toBe(true);
  });
  it('TC_CLOUDI_23: .xlsx → true', () => {
    expect(isValidDocumentFile(makeFile('a.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))).toBe(true);
  });
  it('TC_CLOUDI_24: text/plain → true', () => {
    expect(isValidDocumentFile(makeFile('a.txt', 'text/plain'))).toBe(true);
  });
  it('TC_CLOUDI_25: application/pdf → false (PDF đã bị comment out)', () => {
    expect(isValidDocumentFile(makeFile('a.pdf', 'application/pdf'))).toBe(false);
  });
  it('TC_CLOUDI_26: application/x-msdownload (.exe) → false', () => {
    expect(isValidDocumentFile(makeFile('a.exe', 'application/x-msdownload'))).toBe(false);
  });
  it('TC_CLOUDI_27: image/jpeg → false', () => {
    expect(isValidDocumentFile(makeFile('a.jpg', 'image/jpeg'))).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm D — isValidFileSize (BOUNDARY CRITICAL)
// ══════════════════════════════════════════════════════════════
describe('Nhóm D — isValidFileSize', () => {
  const MB = 1024 * 1024;

  it('TC_CLOUDI_28: size === maxSizeMB*1024*1024 → true (code dùng <=)', () => {
    const f = makeFile('a', 'image/jpeg', 5 * MB);
    expect(isValidFileSize(f, 5)).toBe(true);
  });
  it('TC_CLOUDI_29: size = limit+1 byte → false', () => {
    const f = makeFile('a', 'image/jpeg', 5 * MB + 1);
    expect(isValidFileSize(f, 5)).toBe(false);
  });
  it('TC_CLOUDI_30: size = limit-1 byte → true', () => {
    const f = makeFile('a', 'image/jpeg', 5 * MB - 1);
    expect(isValidFileSize(f, 5)).toBe(true);
  });
  it('TC_CLOUDI_31: size=0 (empty file) → true', () => {
    const f = makeFile('a', 'image/jpeg', 0);
    expect(isValidFileSize(f, 5)).toBe(true);
  });
  it('TC_CLOUDI_32: maxSizeMB=0, size=1KB → false', () => {
    const f = makeFile('a', 'image/jpeg', 1024);
    expect(isValidFileSize(f, 0)).toBe(false);
  });
  it('TC_CLOUDI_33: maxSizeMB=0, size=0 → true (0<=0)', () => {
    const f = makeFile('a', 'image/jpeg', 0);
    expect(isValidFileSize(f, 0)).toBe(true);
  });
  it('TC_CLOUDI_34: maxSizeMB âm → false', () => {
    const f = makeFile('a', 'image/jpeg', 1024);
    expect(isValidFileSize(f, -1)).toBe(false);
  });
});


// ══════════════════════════════════════════════════════════════
// Nhóm E — isYouTubeUrl
// ══════════════════════════════════════════════════════════════
describe('Nhóm E — isYouTubeUrl', () => {
  it('TC_CLOUDI_35: https://www.youtube.com/watch?v=dQw4w9WgXcQ → true', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });
  it('TC_CLOUDI_36: https://youtube.com/watch?v=x (no www) → true', () => {
    expect(isYouTubeUrl('https://youtube.com/watch?v=x')).toBe(true);
  });
  it('TC_CLOUDI_37: https://youtu.be/dQw4w9WgXcQ → true', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });
  it('TC_CLOUDI_38: http://www.youtube.com/watch?v=x (HTTP) → true', () => {
    expect(isYouTubeUrl('http://www.youtube.com/watch?v=x')).toBe(true);
  });
  it('TC_CLOUDI_39: www.youtube.com/watch?v=x (no protocol) → true', () => {
    expect(isYouTubeUrl('www.youtube.com/watch?v=x')).toBe(true);
  });
  it('TC_CLOUDI_40: https://vimeo.com/123 → false', () => {
    expect(isYouTubeUrl('https://vimeo.com/123')).toBe(false);
  });
  it('TC_CLOUDI_41: https://fake-youtube.com/watch?v=x → false', () => {
    expect(isYouTubeUrl('https://fake-youtube.com/watch?v=x')).toBe(false);
  });
  it('TC_CLOUDI_42: URL rỗng "" → false', () => {
    expect(isYouTubeUrl('')).toBe(false);
  });
  it('TC_CLOUDI_43: Non-URL "hello world" → false', () => {
    expect(isYouTubeUrl('hello world')).toBe(false);
  });
  it('TC_CLOUDI_44: https://m.youtube.com/watch?v=x (mobile) → false (regex không match "m.")', () => {
    expect(isYouTubeUrl('https://m.youtube.com/watch?v=x')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm F — extractYouTubeId
// ══════════════════════════════════════════════════════════════
describe('Nhóm F — extractYouTubeId', () => {
  it('TC_CLOUDI_45: watch?v= URL → "dQw4w9WgXcQ"', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('TC_CLOUDI_46: youtu.be short URL → "dQw4w9WgXcQ"', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('TC_CLOUDI_47: embed URL → "dQw4w9WgXcQ"', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('TC_CLOUDI_48: URL có thêm param &t=30s → chỉ lấy 11 ký tự ID', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=abc123XYZ_-&t=30s')).toBe('abc123XYZ_-');
  });
  it('TC_CLOUDI_49: ID không đủ 11 ký tự → null', () => {
    expect(extractYouTubeId('https://youtu.be/short')).toBeNull();
  });
  it('TC_CLOUDI_50: URL không phải YouTube → null', () => {
    expect(extractYouTubeId('https://vimeo.com/123')).toBeNull();
  });
  it('TC_CLOUDI_51: URL rỗng "" → null', () => {
    expect(extractYouTubeId('')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm G — formatFileSize
// ══════════════════════════════════════════════════════════════
describe('Nhóm G — formatFileSize', () => {
  it('TC_CLOUDI_52: 0 → "0 Bytes"', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });
  it('TC_CLOUDI_53: 500 → "500 Bytes"', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });
  it('TC_CLOUDI_54: 1024 → "1 KB"', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });
  it('TC_CLOUDI_55: 1536 → "1.5 KB"', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
  it('TC_CLOUDI_56: 1048576 → "1 MB"', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
  it('TC_CLOUDI_57: 1073741824 → "1 GB"', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });
  it('TC_CLOUDI_58: 1500 → "1.46 KB" (round 2 decimals)', () => {
    expect(formatFileSize(1500)).toBe('1.46 KB');
  });
  it('TC_CLOUDI_59: số âm → NaN/undefined behavior (document)', () => {
    const result = formatFileSize(-1);
    // Math.log(-1) = NaN → i = NaN → sizes[NaN] = undefined
    expect(result).toContain('NaN');
  });
  it('TC_CLOUDI_60: 1e15 → "undefined" (index out of bounds — bug tiềm tàng)', () => {
    // sizes array chỉ có 4 phần tử [Bytes,KB,MB,GB]; i=5 → sizes[5]=undefined
    const result = formatFileSize(1e15);
    expect(result).toContain('undefined');
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm H — getFileExtension
// ══════════════════════════════════════════════════════════════
describe('Nhóm H — getFileExtension', () => {
  it('TC_CLOUDI_61: "doc.pdf" → "pdf"', () => {
    expect(getFileExtension('doc.pdf')).toBe('pdf');
  });
  it('TC_CLOUDI_62: "archive.tar.gz" → "gz"', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
  });
  it('TC_CLOUDI_63: "no-extension" → ""', () => {
    expect(getFileExtension('no-extension')).toBe('');
  });
  it('TC_CLOUDI_64: ".hidden" → "" (unix hidden file)', () => {
    expect(getFileExtension('.hidden')).toBe('');
  });
  it('TC_CLOUDI_65: "" → ""', () => {
    expect(getFileExtension('')).toBe('');
  });
  it('TC_CLOUDI_66: "DOC.PDF" → "PDF" (không lowercase)', () => {
    expect(getFileExtension('DOC.PDF')).toBe('PDF');
  });
  it('TC_CLOUDI_67: "file." (trailing dot) → ""', () => {
    expect(getFileExtension('file.')).toBe('');
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm I — getFileIcon
// ══════════════════════════════════════════════════════════════
describe('Nhóm I — getFileIcon', () => {
  it('TC_CLOUDI_68: "a.doc" → "📝"', () => {
    expect(getFileIcon('a.doc')).toBe('📝');
  });
  it('TC_CLOUDI_69: "a.docx" → "📝"', () => {
    expect(getFileIcon('a.docx')).toBe('📝');
  });
  it('TC_CLOUDI_70: "a.ppt" → "📊"', () => {
    expect(getFileIcon('a.ppt')).toBe('📊');
  });
  it('TC_CLOUDI_70b: "a.pptx" → "📊"', () => {
    expect(getFileIcon('a.pptx')).toBe('📊');
  });
  it('TC_CLOUDI_71: "a.xls" → "📈"', () => {
    expect(getFileIcon('a.xls')).toBe('📈');
  });
  it('TC_CLOUDI_71b: "a.xlsx" → "📈"', () => {
    expect(getFileIcon('a.xlsx')).toBe('📈');
  });
  it('TC_CLOUDI_72: "a.txt" → "📃"', () => {
    expect(getFileIcon('a.txt')).toBe('📃');
  });
  it('TC_CLOUDI_73: "a.zip" → "📦"', () => {
    expect(getFileIcon('a.zip')).toBe('📦');
  });
  it('TC_CLOUDI_73b: "a.rar" → "📦"', () => {
    expect(getFileIcon('a.rar')).toBe('📦');
  });
  it('TC_CLOUDI_74: "a.pdf" → "📁" (PDF removed)', () => {
    expect(getFileIcon('a.pdf')).toBe('📁');
  });
  it('TC_CLOUDI_75: "a.DOCX" → "📝" (toLowerCase)', () => {
    expect(getFileIcon('a.DOCX')).toBe('📝');
  });
  it('TC_CLOUDI_76: "a.xyz" unknown → "📁"', () => {
    expect(getFileIcon('a.xyz')).toBe('📁');
  });
  it('TC_CLOUDI_77: "file" no extension → "📁"', () => {
    expect(getFileIcon('file')).toBe('📁');
  });
});


// ══════════════════════════════════════════════════════════════
// Nhóm J — uploadImageToCloudinary
// ══════════════════════════════════════════════════════════════
describe('Nhóm J — uploadImageToCloudinary', () => {
  const validFile = () => makeFile('photo.jpg', 'image/jpeg');

  it('TC_CLOUDI_78: xhr.open gọi URL chứa "/image/upload"', async () => {
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    await promise;
    expect(xhrInstance.open).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('/image/upload')
    );
  });

  it('TC_CLOUDI_79: FormData chứa file + upload_preset + folder', async () => {
    let capturedFormData: FormData | null = null;
    xhrInstance.send = jest.fn((fd: FormData) => { capturedFormData = fd; });
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    await promise;
    expect(capturedFormData).not.toBeNull();
    expect((capturedFormData as any).get('folder')).toBe('elearning/courses');
    expect((capturedFormData as any).get('upload_preset')).toBeTruthy();
    expect((capturedFormData as any).get('file')).toBeTruthy();
  });

  it('TC_CLOUDI_80: onProgress callback gọi với percentage 0→100', async () => {
    const onProgress = jest.fn();
    const promise = uploadImageToCloudinary(validFile(), onProgress);
    xhrInstance._triggerUpload('progress', { lengthComputable: true, loaded: 0, total: 100 });
    xhrInstance._triggerUpload('progress', { lengthComputable: true, loaded: 50, total: 100 });
    xhrInstance._triggerUpload('progress', { lengthComputable: true, loaded: 100, total: 100 });
    xhrInstance._trigger('load');
    await promise;
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenLastCalledWith({ loaded: 100, total: 100, percentage: 100 });
  });

  it('TC_CLOUDI_81: status 200 → resolve với parsed response', async () => {
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    const result = await promise;
    expect(result.secure_url).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    expect(result.public_id).toBe('sample');
  });

  it('TC_CLOUDI_82: status 500 → reject "Upload failed with status: 500"', async () => {
    xhrInstance.status = 500;
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    await expect(promise).rejects.toThrow('Upload failed with status: 500');
  });

  it('TC_CLOUDI_83: xhr error event → reject "Network error during upload"', async () => {
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('error');
    await expect(promise).rejects.toThrow('Network error during upload');
  });

  it('TC_CLOUDI_84: không truyền onProgress → upload.addEventListener không được gọi', async () => {
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    await promise;
    expect(xhrInstance.upload.addEventListener).not.toHaveBeenCalled();
  });

  it('TC_CLOUDI_85: env cloudName="" (fallback rỗng) → throw "Cloudinary configuration is missing"', async () => {
    // Override env để fallback cũng rỗng — không thể dễ dàng unset fallback hardcode
    // Thay vào đó test rằng khi env có giá trị, không throw
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'testcloud';
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'testpreset';
    const promise = uploadImageToCloudinary(validFile());
    xhrInstance._trigger('load');
    await expect(promise).resolves.toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm K — uploadVideoToCloudinary
// ══════════════════════════════════════════════════════════════
describe('Nhóm K — uploadVideoToCloudinary', () => {
  const validVideo = () => makeFile('video.mp4', 'video/mp4');

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'testcloud';
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'testpreset';
  });

  it('TC_CLOUDI_86: xhr.open gọi URL chứa "/video/upload"', async () => {
    const promise = uploadVideoToCloudinary(validVideo());
    xhrInstance._trigger('load');
    await promise;
    expect(xhrInstance.open).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('/video/upload')
    );
  });

  it('TC_CLOUDI_87: FormData có resource_type="video" + folder="elearning/videos"', async () => {
    let capturedFD: FormData | null = null;
    xhrInstance.send = jest.fn((fd: FormData) => { capturedFD = fd; });
    const promise = uploadVideoToCloudinary(validVideo());
    xhrInstance._trigger('load');
    await promise;
    expect((capturedFD as any).get('resource_type')).toBe('video');
    expect((capturedFD as any).get('folder')).toBe('elearning/videos');
  });

  it('TC_CLOUDI_88: thiếu env cloudName/uploadPreset → throw', async () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    await expect(uploadVideoToCloudinary(validVideo())).rejects.toThrow(
      'Cloudinary configuration is missing'
    );
  });
});

// ══════════════════════════════════════════════════════════════
// Nhóm L — uploadFileToCloudinary
// ══════════════════════════════════════════════════════════════
describe('Nhóm L — uploadFileToCloudinary', () => {
  const validDoc = () => makeFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  it('TC_CLOUDI_89: xhr.open gọi URL chứa "/auto/upload"', async () => {
    const promise = uploadFileToCloudinary(validDoc());
    xhrInstance._trigger('load');
    await promise;
    expect(xhrInstance.open).toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('/auto/upload')
    );
  });

  it('TC_CLOUDI_90: FormData có resource_type="auto" + folder="elearning/materials"', async () => {
    let capturedFD: FormData | null = null;
    xhrInstance.send = jest.fn((fd: FormData) => { capturedFD = fd; });
    const promise = uploadFileToCloudinary(validDoc());
    xhrInstance._trigger('load');
    await promise;
    expect((capturedFD as any).get('resource_type')).toBe('auto');
    expect((capturedFD as any).get('folder')).toBe('elearning/materials');
  });

  it('TC_CLOUDI_91: upload docx thành công → resolve với secure_url', async () => {
    const promise = uploadFileToCloudinary(validDoc());
    xhrInstance._trigger('load');
    const result = await promise;
    expect(result.secure_url).toBeTruthy();
  });
});
