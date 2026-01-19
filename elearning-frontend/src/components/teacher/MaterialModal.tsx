"use client";

import { useState, useEffect } from "react";
import { CourseMaterial } from "@/@types/Course.type";
import coursesAPI from "@/apis/courses";
import {
  uploadFileToCloudinary,
  isValidDocumentFile,
  isValidFileSize,
  formatFileSize,
  getFileExtension,
} from "@/utils/cloudinary";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  material?: CourseMaterial | null;
  onSuccess: () => void;
}

export default function MaterialModal({
  isOpen,
  onClose,
  courseId,
  material,
  onSuccess,
}: MaterialModalProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      setTitle(material.title || "");
      setFileUrl(material.fileUrl || "");
    } else {
      setTitle("");
      setFile(null);
      setFileUrl("");
      setUploadProgress(0);
    }
  }, [material, isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!isValidDocumentFile(selectedFile)) {
      alert("Vui lòng chọn file tài liệu hợp lệ (DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT)");
      return;
    }

    // Validate file size (max 10MB)
    if (!isValidFileSize(selectedFile, 10)) {
      alert(`Kích thước file không được vượt quá 10MB. File hiện tại: ${formatFileSize(selectedFile.size)}`);
      return;
    }

    setFile(selectedFile);

    // Auto set title from filename if empty
    if (!title) {
      const filename = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setTitle(filename);
    }

    // Upload to Cloudinary
    try {
      setUploading(true);
      const response = await uploadFileToCloudinary(selectedFile, (progress) => {
        setUploadProgress(progress.percentage);
      });

      setFileUrl(response.secure_url);
      alert("Upload file thành công!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Upload file thất bại. Vui lòng thử lại!");
      setFile(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Vui lòng nhập tên tài liệu!");
      return;
    }

    if (!fileUrl && !material) {
      alert("Vui lòng upload file tài liệu!");
      return;
    }

    try {
      setSubmitting(true);

      const fileSize = file ? Math.round(file.size / 1024) : material?.fileSizeKb || 0;

      if (material) {
        // Update existing material
        await coursesAPI.updateCourseMaterial(courseId, material.id, {
          title: title.trim(),
          fileUrl: fileUrl || material.fileUrl,
          fileSizeKb: fileSize,
        });
        alert("Cập nhật tài liệu thành công!");
      } else {
        // Create new material
        await coursesAPI.addCourseMaterial(courseId, {
          title: title.trim(),
          fileUrl: fileUrl,
          fileSizeKb: fileSize,
        });
        alert("Thêm tài liệu thành công!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving material:", error);
      alert(error.response?.data?.message || error.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên tài liệu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên tài liệu..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File tài liệu {!material && <span className="text-red-500">*</span>}
            </label>

            {fileUrl && (
              <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {file ? getFileExtension(file.name) === 'pdf' ? '📄' : '📁' : '📄'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      {file?.name || material?.title || "File đã upload"}
                    </p>
                    {file && (
                      <p className="text-sm text-green-600">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                className="hidden"
                id="material-file-input"
                disabled={uploading}
              />
              <label
                htmlFor="material-file-input"
                className={`flex items-center justify-center gap-3 px-6 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploading
                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                    : "border-gray-300 hover:border-primary-500 hover:bg-primary-50"
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700 font-medium">
                      Đang upload... {uploadProgress}%
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {fileUrl ? "Chọn file khác" : "Chọn file tài liệu"}
                    </span>
                  </>
                )}
              </label>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Hỗ trợ: DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT. Tối đa 10MB.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={submitting || uploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !fileUrl}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>{material ? "Cập nhật" : "Thêm tài liệu"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
