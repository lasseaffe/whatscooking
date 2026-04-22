declare module "react-simple-maps" {
  import React from "react";

  export interface GeographyRecord {
    rsmKey: string;
    id: string | number;
    properties: Record<string, unknown>;
    geometry: unknown;
  }

  export interface GeographiesChildProps {
    geographies: GeographyRecord[];
    outline: unknown;
    borders: unknown;
  }

  export interface ComposableMapProps {
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildProps) => React.ReactNode;
    [key: string]: unknown;
  }

  export interface GeographyProps {
    geography: GeographyRecord;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: { default?: React.CSSProperties; hover?: React.CSSProperties; pressed?: React.CSSProperties };
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    [key: string]: unknown;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
  export const Graticule: React.FC<Record<string, unknown>>;
  export const Sphere: React.FC<Record<string, unknown>>;
  export const Annotation: React.FC<Record<string, unknown>>;
  export const Line: React.FC<Record<string, unknown>>;
}
