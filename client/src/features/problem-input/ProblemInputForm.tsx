import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Upload, X, Search, ShieldCheck, Loader2 } from "lucide-react";
import { SampleScenarios } from "./SampleScenarios";

interface ProblemInputFormProps {
  onSubmit: (description: string, imageFile?: File) => void;
  isLoading: boolean;
}

export const ProblemInputForm: React.FC<ProblemInputFormProps> = ({ onSubmit, isLoading }) => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds the 5 MB upload limit.");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 3) {
      setErrorMsg("Please describe your problem in at least 3 characters.");
      return;
    }
    setErrorMsg(null);
    onSubmit(description.trim(), imageFile || undefined);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
      >
        {/* Text Input Area */}
        <div className="space-y-2">
          <label
            htmlFor="problem-description"
            className="block text-sm font-semibold text-slate-800"
          >
            What problem or stain are you dealing with?
          </label>
          <textarea
            id="problem-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Fresh black coffee spilled on my favorite cotton hoodie, or candle wax dried on an oak desk..."
            className="w-full text-sm rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all resize-none"
          />
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Be specific about the material, age of stain, and any prior cleaning steps.</span>
            <span>{description.length} / 2000</span>
          </div>
        </div>

        {/* Optional Image Upload Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Optional Photo (JPEG, PNG, or WebP up to 5MB)
          </label>

          {!imageFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-brand-500 bg-brand-50/50"
                  : "border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />
              <div className="flex flex-col items-center gap-1.5 text-slate-500">
                <Upload className="w-6 h-6 text-slate-400" />
                <p className="text-xs font-medium">
                  <span className="font-semibold text-brand-700">Click to upload photo</span> or drag & drop
                </p>
                <p className="text-[11px] text-slate-400">
                  Allows visual pattern analysis (or honest demo simulated observation)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50">
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt="Upload preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{imageFile.name}</p>
                <p className="text-[11px] text-slate-400">
                  {Math.round(imageFile.size / 1024)} KB • {imageFile.type}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-700 to-teal-800 hover:from-brand-800 hover:to-teal-900 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing Problem & Checking Safety Rules...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 text-teal-200" />
                <span>Find a Safe Solution</span>
              </>
            )}
          </button>
        </div>

        {/* Privacy & Safety Micro-Notice */}
        <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            Safety-First Guarantee: Inputs pass server-enforced hazard checks. Images are kept in memory
            for session analysis only and never stored permanently.
          </span>
        </div>
      </form>

      {/* Sample Scenario Shortcuts */}
      <SampleScenarios
        onSelectScenario={(text) => {
          setDescription(text);
          setErrorMsg(null);
        }}
      />
    </div>
  );
};
