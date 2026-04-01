"use client";

type GeneralImageProps = {
  src: string;
  alt: string;
};

export default function GeneralImage({ src, alt }: GeneralImageProps) {
  return (
    <img
      alt={alt}
      className="h-full w-full object-cover object-top"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
      src={src}
    />
  );
}
