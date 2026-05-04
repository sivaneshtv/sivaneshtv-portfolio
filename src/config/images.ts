/**
 * Central image format config for all case studies.
 *
 * To revert all images to lossless PNG:
 *   change IMAGE_FORMAT to 'png' and run `npm run build`
 *
 * To adjust quality if WebP looks soft:
 *   raise IMAGE_QUALITY (70–95 range; 85 is the default sweet spot)
 */
export const IMAGE_FORMAT  = 'png' as const;   // 'webp' | 'png' | 'avif'
export const IMAGE_QUALITY = 85;               // 70–95
export const IMAGE_WIDTH   = 2400;             // px — 2× retina at max reading column width
