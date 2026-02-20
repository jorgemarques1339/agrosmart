
import React, { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { db } from '../services/db';

interface OfflineTileLayerProps extends L.TileLayerOptions {
    url: string;
}

const OfflineTileLayer: React.FC<OfflineTileLayerProps> = ({ url, ...options }) => {
    const map = useMap();

    useEffect(() => {
        // Extend Leaflet TileLayer for Offline Support
        const CustomTileLayer = L.TileLayer.extend({
            createTile: function (coords: L.Coords, done: L.DoneCallback) {
                const tile = document.createElement('img');
                const tileUrl = this.getTileUrl(coords);

                // Try to get from Dexie Cache
                db.tiles.get(tileUrl).then(cached => {
                    if (cached) {
                        // Found in cache!
                        const objectUrl = URL.createObjectURL(cached.data);
                        tile.src = objectUrl;

                        // Cleanup object URL when tile is removed
                        L.DomEvent.on(tile, 'load', () => {
                            // We keep it until the image is actually rendered
                        });

                        done(undefined, tile);
                    } else {
                        // Not in cache, fetch from network
                        fetch(tileUrl, { mode: 'cors' })
                            .then(response => {
                                if (!response.ok) throw new Error('Network response icon was not ok');
                                return response.blob();
                            })
                            .then(blob => {
                                // Save to cache
                                db.tiles.put({
                                    id: tileUrl,
                                    data: blob,
                                    timestamp: Date.now()
                                }).catch(e => console.error("Error caching tile:", e));

                                const objectUrl = URL.createObjectURL(blob);
                                tile.src = objectUrl;
                                done(undefined, tile);
                            })
                            .catch(error => {
                                // If offline and not in cache, the tile will just be empty/broken
                                // console.log("Tile not available offline:", tileUrl);
                                done(error, tile);
                            });
                    }
                }).catch(err => {
                    done(err, tile);
                });

                return tile;
            }
        });

        const layer = new (CustomTileLayer as any)(url, options);
        layer.addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map, url, JSON.stringify(options)]);

    return null;
};

export default OfflineTileLayer;
