import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import { LatLngBounds } from "leaflet";

const DEFAULT_CENTER = [53.1325, 23.1688];
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function MapViewport({ points }) {
    const map = useMap();

    if (!points.length) {
        map.setView(DEFAULT_CENTER, 11);
        return null;
    }

    if (points.length === 1) {
        map.setView(points[0], 13);
        return null;
    }

    const bounds = new LatLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
    return null;
}

function normalizeGeometry(geometry) {
    if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) {
        return [];
    }

    return geometry.coordinates
        .filter((coordinate) => Array.isArray(coordinate) && coordinate.length === 2)
        .map(([longitude, latitude]) => [latitude, longitude]);
}

function normalizePoint(point) {
    if (!point) {
        return null;
    }

    const latitude = Number(point.latitude);
    const longitude = Number(point.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
    }

    return [latitude, longitude];
}

function RideMap({
    start,
    end,
    geometry = null,
    className = "",
    heightClassName = "h-80",
    zoom = 11,
}) {
    const startPoint = normalizePoint(start);
    const endPoint = normalizePoint(end);
    const routePoints = normalizeGeometry(geometry);
    const viewportPoints = routePoints.length ? routePoints : [startPoint, endPoint].filter(Boolean);

    return (
        <div className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner ${heightClassName} ${className}`.trim()}>
            <MapContainer
                center={viewportPoints[0] || DEFAULT_CENTER}
                zoom={zoom}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
                <MapViewport points={viewportPoints} />

                {routePoints.length > 1 && (
                    <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#1f5f2f", weight: 5, opacity: 0.85 }}
                    />
                )}

                {startPoint && (
                    <CircleMarker center={startPoint} radius={8} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 1 }}>
                        <Popup>Punkt startowy</Popup>
                    </CircleMarker>
                )}

                {endPoint && (
                    <CircleMarker center={endPoint} radius={8} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 1 }}>
                        <Popup>Punkt docelowy</Popup>
                    </CircleMarker>
                )}
            </MapContainer>
        </div>
    );
}

export default RideMap;
