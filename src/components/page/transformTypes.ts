export interface TapeGeometry {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface TapeDrag {
  id: string
  handle: string
  startX: number
  startY: number
  geometry: TapeGeometry
  box: DOMRect
}
