<template>
  <div class="map-wrapper relative-position rounded-borders overflow-hidden shadow-2">
    <div ref="mapContainer" :style="{ height: height, width: '100%' }"></div>
    <div v-if="loading" class="absolute-full bg-dark-transparent flex flex-center z-top">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Anonymization Mode Toggle Badge -->
    <div class="absolute-top-right q-ma-sm" style="z-index: 1000">
      <q-badge
        :color="isAnonymized ? 'indigo-7' : 'grey-8'"
        class="q-pa-xs text-caption cursor-pointer shadow-2"
        @click="isAnonymized = !isAnonymized"
      >
        <q-icon :name="isAnonymized ? 'visibility_off' : 'visibility'" class="q-mr-xs" />
        {{ isAnonymized ? 'Geodata Anonymized (~1km Grid)' : 'Exact GPS Coordinates' }}
      </q-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import type { SubmissionDoc } from '../composables/useDatabase';

const props = withDefaults(
  defineProps<{
    submissions?: SubmissionDoc[];
    singleLocation?: { latitude: number; longitude: number; accuracy?: number | undefined } | null;
    height?: string;
    interactive?: boolean;
    anonymize?: boolean;
  }>(),
  {
    submissions: () => [],
    singleLocation: null,
    height: '450px',
    interactive: false,
    anonymize: false,
  },
);

const isAnonymized = ref(props.anonymize);

const emit = defineEmits<{
  (e: 'selectLocation', loc: { latitude: number; longitude: number }): void;
  (e: 'selectSubmission', doc: SubmissionDoc): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;

// Helper: Extract lat/lng from submission data and apply coarsening when anonymized
const extractCoords = (doc: SubmissionDoc): { lat: number; lng: number } | null => {
  let raw: { lat: number; lng: number } | null = null;

  if (doc.metadata?.location && typeof doc.metadata.location.latitude === 'number') {
    raw = { lat: doc.metadata.location.latitude, lng: doc.metadata.location.longitude };
  } else if (doc.data?.location && typeof doc.data.location === 'object') {
    const loc = doc.data.location as {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
    };
    const lat = loc.latitude ?? loc.lat;
    const lng = loc.longitude ?? loc.lng;
    if (typeof lat === 'number' && typeof lng === 'number') raw = { lat, lng };
  } else if (typeof doc.data?.latitude === 'number' && typeof doc.data?.longitude === 'number') {
    raw = { lat: doc.data.latitude as number, lng: doc.data.longitude as number };
  }

  if (!raw) return null;

  if (isAnonymized.value) {
    // Coarsen coordinates to 2 decimal places (~1.1km grid precision)
    return {
      lat: Math.round(raw.lat * 100) / 100,
      lng: Math.round(raw.lng * 100) / 100,
    };
  }

  return raw;
};

// Create custom pin icon based on status
const createCustomIcon = (status?: string) => {
  let color = '#10b981'; // Green (good / default)
  if (status === 'critical') color = '#ef4444'; // Red
  if (status === 'damaged') color = '#f59e0b'; // Amber

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const initMap = () => {
  if (!mapContainer.value) return;

  // Default center: Erbil / KRI Region (36.1911, 44.0091)
  const defaultLat = props.singleLocation?.latitude ?? 36.1911;
  const defaultLng = props.singleLocation?.longitude ?? 44.0091;
  const zoomLevel = props.singleLocation ? 14 : 9;

  map = L.map(mapContainer.value, {
    center: [defaultLat, defaultLng],
    zoom: zoomLevel,
    zoomControl: true,
  });

  // OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  if (props.interactive) {
    map.on('click', (e: L.LeafletMouseEvent) => {
      emit('selectLocation', { latitude: e.latlng.lat, longitude: e.latlng.lng });
    });
  }

  updateMarkers();
};

const updateMarkers = () => {
  if (!map || !markersLayer) return;

  markersLayer.clearLayers();

  const bounds = L.latLngBounds([]);

  // Render single location if passed (e.g. in FormEngine)
  if (props.singleLocation) {
    const { latitude, longitude, accuracy } = props.singleLocation;
    const latLng = L.latLng(latitude, longitude);

    L.marker(latLng, { icon: createCustomIcon('good') })
      .bindPopup(
        `<b>Erfasster Standort</b><br>Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
      )
      .addTo(markersLayer);

    if (accuracy) {
      L.circle(latLng, {
        radius: accuracy,
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.25,
      }).addTo(markersLayer);
    }

    map.setView(latLng, 14);
    return;
  }

  // Render multiple submissions
  let validCount = 0;
  props.submissions.forEach((sub) => {
    const coords = extractCoords(sub);
    if (!coords) return;

    validCount++;
    const latLng = L.latLng(coords.lat, coords.lng);
    bounds.extend(latLng);

    const status = (sub.data?.shelter_condition as string) || 'good';
    const marker = L.marker(latLng, { icon: createCustomIcon(status) });

    const title =
      typeof sub.data?.family_head_name === 'string' ? sub.data.family_head_name : sub._id;
    const popupContent = `
      <div style="font-family: sans-serif; padding: 4px; color: #1e293b;">
        <strong style="font-size: 14px; color: #0f172a;">${title}</strong><br/>
        <span style="font-size: 12px; color: #475569;">ID: ${sub._id}</span><br/>
        <span style="font-size: 12px; color: #475569;">Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}</span>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => {
      emit('selectSubmission', sub);
    });

    markersLayer!.addLayer(marker);
  });

  if (validCount > 0 && map) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
};

watch(
  () => [props.submissions, props.singleLocation, isAnonymized.value],
  () => {
    updateMarkers();
  },
  { deep: true },
);

onMounted(() => {
  setTimeout(() => {
    initMap();
    if (map) map.invalidateSize();
  }, 100);
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.map-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
