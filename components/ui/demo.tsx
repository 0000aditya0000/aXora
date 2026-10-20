"use client"

import HalftoneWordmarkFooter from "./halftone-wordmark-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <HalftoneWordmarkFooter
        wordmark="axora"
        label="aXora Edge Link Intelligence"
        meta="©2026 aXora Inc. · Zero-Trust v4 · Anycast 284 POPs"
      />
    </div>
  )
}
