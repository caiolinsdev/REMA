/* eslint-disable @next/next/no-img-element */

import type { ImgHTMLAttributes } from "react";

export function MediaImage({
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} {...props} />;
}
