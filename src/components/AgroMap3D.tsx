import React, { useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { PolygonLayer, PathLayer } from '@deck.gl/layers';

// Esri World Imagery Satellite Map Style
const MAP_STYLE: any = {
    version: 8,
    sources: {
        'satellite-tiles': {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri'
        }
    },
    layers: [
        {
            id: 'satellite',
            type: 'raster',
            source: 'satellite-tiles',
            minzoom: 0,
            maxzoom: 22
        }
    ]
};

// AWS Terrain Tiles for 3D elevation (Free)
const TERRAIN_SOURCE = {
    type: 'raster-dem' as const,
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    encoding: 'terrarium' as const,
    tileSize: 256
};

// Lighting effect for Deck.gl (makes 3D objects look better)
const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});
const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 0.8,
    position: [-0.144528, 49.739968, 80000]
});
const lightingEffect = new LightingEffect({ ambientLight, pointLight });

interface AgroMap3DProps {
    initialViewState: {
        longitude: number;
        latitude: number;
        zoom: number;
        pitch?: number;
        bearing?: number;
    };
    polygons?: { coordinates: [number, number][], color?: [number, number, number, number] }[];
    paths?: { coordinates: [number, number][], color?: [number, number, number, number], width?: number }[];
    thermalData?: { coordinates: [number, number], weight: number }[];
    showThermal?: boolean;
    onClick?: (info: any, event: any) => void;
    children?: React.ReactNode;
    className?: string;
}

export const AgroMap3D: React.FC<AgroMap3DProps> = ({
    initialViewState,
    polygons = [],
    paths = [],
    thermalData = [],
    showThermal = false,
    onClick,
    children,
    className = ''
}) => {

    const layers = useMemo(() => {
        const tempLayers: any[] = [];

        // Base Field Polygons
        if (polygons.length > 0) {
            tempLayers.push(
                new PolygonLayer({
                    id: 'field-polygons',
                    data: polygons,
                    getPolygon: d => d.coordinates,
                    getFillColor: d => d.color || [59, 130, 246, 100], // Default Blue with opacity
                    getLineColor: [255, 255, 255],
                    getLineWidth: 2,
                    lineWidthMinPixels: 2,
                    pickable: true,
                })
            );
        }

        // Thermal / NDVI Heatmap Layer
        if (showThermal && thermalData.length > 0) {
            tempLayers.push(
                new HeatmapLayer({
                    id: 'thermal-heatmap',
                    data: thermalData,
                    getPosition: d => d.coordinates,
                    getWeight: d => d.weight,
                    radiusPixels: 60,
                    intensity: 1,
                    threshold: 0.1,
                    colorRange: [
                        [0, 255, 0, 100],     // Wet / Cool / High Vigor (Green)
                        [255, 255, 0, 150],   // Moderate (Yellow)
                        [255, 165, 0, 200],   // Stress (Orange)
                        [255, 0, 0, 200]      // Critical Stress / Dry / Heat (Red)
                    ],
                })
            );
        }

        // Path/Lines Layer (Routes)
        if (paths.length > 0) {
            tempLayers.push(
                new PathLayer({
                    id: 'path-layer',
                    data: paths,
                    pickable: true,
                    widthScale: 1,
                    widthMinPixels: 3,
                    getPath: d => d.coordinates,
                    getColor: d => d.color || [139, 92, 246, 255],
                    getWidth: d => d.width || 4
                })
            );
        }

        return tempLayers;
    }, [polygons, paths, thermalData, showThermal]);

    return (
        <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}>
            <DeckGL
                initialViewState={{
                    ...initialViewState,
                    pitch: initialViewState.pitch ?? 45,
                    bearing: initialViewState.bearing ?? 0
                }}
                controller={true}
                layers={layers}
                effects={[lightingEffect]}
                onClick={onClick}
            >
                <Map
                    mapStyle={MAP_STYLE}
                    terrain={TERRAIN_SOURCE as any}
                    maxPitch={85}
                >
                    <NavigationControl position="top-right" visualizePitch={true} />
                    {children}
                </Map>
            </DeckGL>
        </div>
    );
};
