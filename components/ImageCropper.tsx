"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((r) => (image.onload = r));

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
  });
}

type Props = {
  image: string;
  onCropDone: (desktopBlob: Blob, mobileBlob: Blob) => void;
  onCancel: () => void;
};

type Step = "desktop" | "mobile";

export default function ImageCropper({ image, onCropDone, onCancel }: Props) {
  const [step, setStep] = useState<Step>("desktop");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);

  const [desktopBlob, setDesktopBlob] = useState<Blob | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedPixels(areaPixels);
  }, []);

  const handleNext = async () => {
    if (!croppedPixels) return;
    if (step === "desktop") {
      const blob = await getCroppedBlob(image, croppedPixels);
      setDesktopBlob(blob);
      setDesktopPreview(URL.createObjectURL(blob));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      setStep("mobile");
    } else {
      const mobileBlob = await getCroppedBlob(image, croppedPixels);
      onCropDone(desktopBlob!, mobileBlob);
    }
  };

  const handleBack = () => {
    if (step === "mobile") {
      setDesktopBlob(null);
      setDesktopPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedPixels(null);
      setStep("desktop");
    } else {
      onCancel();
    }
  };

  const isDesktop = step === "desktop";

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isDesktop ? "bg-primary text-black" : "bg-primary/10 text-primary"}`}>
          <span>1</span>
          <span>Masaüstü</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-secondary)" }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${!isDesktop ? "bg-primary text-black" : "bg-primary/10 text-primary"}`}>
          <span>2</span>
          <span>Mobil</span>
        </div>
      </div>

      {/* Aspect info */}
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {isDesktop
          ? "Masaüstünde nasıl görüneceğini ayarla (yatay 16:9)"
          : "Mobilde nasıl görüneceğini ayarla (dikey 4:5)"}
      </p>

      {/* Crop area */}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 300 }}>
        <Cropper
          key={step}
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={isDesktop ? 16 / 9 : 4 / 5}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{ containerStyle: { borderRadius: 12 } }}
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Yakınlaştır</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
      </div>

      {/* Desktop preview (shown during mobile step) */}
      {!isDesktop && desktopPreview && (
        <div>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Masaüstü kırpman:
          </p>
          <img
            src={desktopPreview}
            alt="Desktop crop"
            className="w-full max-w-xs rounded-lg border border-(--border)"
            style={{ aspectRatio: "16/9", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-(--border) hover:border-primary transition-all"
        >
          {isDesktop ? "Değiştir" : "Geri"}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-black hover:bg-primary-light transition-all"
        >
          {isDesktop ? "Devam → Mobil" : "Kırpmayı Onayla"}
        </button>
      </div>
    </div>
  );
}
