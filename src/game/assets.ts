// Original supplied artwork is used as-is: no AI repainting, cropping, or vertex warping.
// Place files in public/assets/ and set paths relative to the Vite deployment base.
export const assets = {
  memoraPoster: "assets/memora-poster.png" as string | null, // Supplied 1013.png, copied byte-for-byte.
  historicalPhoto: null as string | null, // Only a supplied/licensed real historical photograph.
};
export const assetURL = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
