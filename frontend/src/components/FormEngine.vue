<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <div class="q-pb-md q-mb-md">
      <h3 class="text-h6 text-bold text-primary q-my-none">
        {{ template.title }}
      </h3>
      <p class="text-caption text-grey-5 q-mt-xs">
        {{ $t('form_desc') }}
      </p>
    </div>
    <q-separator class="q-mb-md" />

    <div class="q-gutter-y-md">
      <template v-for="field in template.fields" :key="field.id">
        <!-- Section Header -->
        <div
          v-if="field.type === 'section' && checkCondition(field)"
          :id="`field-group-${field.id}`"
          class="q-my-md q-pt-sm"
        >
          <div class="row items-center q-gutter-x-sm">
            <q-icon :name="field.section_icon || 'bookmark'" color="indigo-5" size="22px" />
            <span class="text-subtitle1 text-bold text-indigo-5">
              {{ field.label }}
            </span>
          </div>
          <p v-if="field.hint" class="text-caption text-grey-5 q-my-none q-ml-md">
            {{ field.hint }}
          </p>
          <q-separator class="q-mt-xs" color="indigo-3" />
        </div>

        <!-- Input Cards for Standard Fields -->
        <q-card
          v-else-if="checkCondition(field)"
          :id="`field-group-${field.id}`"
          bordered
          class="q-pa-md transition-all"
        >
          <div
            class="text-subtitle2 text-bold q-mb-xs"
            :class="$q.dark.isActive ? 'text-grey-2' : 'text-grey-9'"
          >
            {{ field.label }}
            <span v-if="field.required" class="text-red">*</span>
          </div>

          <p v-if="field.hint" class="text-caption text-grey-5 q-mb-sm">
            {{ field.hint }}
          </p>

          <!-- Text Field -->
          <q-input
            v-if="field.type === 'text'"
            v-model="getTextFieldModel(field.id).value"
            outlined
            dense
            :dark="$q.dark.isActive"
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :placeholder="field.placeholder || $t('input_placeholder')"
            :rules="getRules(field)"
            lazy-rules
          />

          <!-- Textarea Field -->
          <q-input
            v-if="field.type === 'textarea'"
            v-model="getTextFieldModel(field.id).value"
            type="textarea"
            rows="3"
            outlined
            dense
            :dark="$q.dark.isActive"
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :placeholder="field.placeholder || $t('input_placeholder')"
            :rules="getRules(field)"
            lazy-rules
          />

          <!-- Number Field -->
          <q-input
            v-if="field.type === 'number'"
            v-model.number="getNumberFieldModel(field.id).value"
            type="number"
            outlined
            dense
            :dark="$q.dark.isActive"
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :placeholder="field.placeholder || $t('number_placeholder')"
            :rules="getRules(field)"
            lazy-rules
          />

          <!-- Boolean Switch -->
          <div v-if="field.type === 'boolean'" class="row items-center q-py-sm">
            <q-toggle
              v-model="formData[field.id]"
              color="indigo-5"
              :dark="$q.dark.isActive"
              :label="formData[field.id] ? $t('yes') : $t('no')"
            />
          </div>

          <!-- Select Field -->
          <q-select
            v-if="field.type === 'select'"
            v-model="formData[field.id]"
            outlined
            dense
            :dark="$q.dark.isActive"
            emit-value
            map-options
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :options="field.options || []"
            :placeholder="field.placeholder"
            :rules="getRules(field)"
            lazy-rules
          />

          <!-- Multiselect Field -->
          <q-select
            v-if="field.type === 'multiselect'"
            v-model="getArrayFieldModel(field.id).value"
            multiple
            use-chips
            outlined
            dense
            :dark="$q.dark.isActive"
            emit-value
            map-options
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :options="field.options || []"
            :rules="getRules(field)"
            lazy-rules
          />

          <!-- Date Field -->
          <q-input
            v-if="field.type === 'date'"
            v-model="getTextFieldModel(field.id).value"
            type="date"
            outlined
            dense
            :dark="$q.dark.isActive"
            color="indigo-5"
            :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
            :rules="getRules(field)"
            lazy-rules
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="formData[field.id]" mask="YYYY-MM-DD" color="indigo-5">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <!-- Location (GPS) Field -->
          <div v-if="field.type === 'location'" class="q-gutter-y-sm">
            <div class="row items-center gap-2">
              <q-btn
                color="indigo-6"
                icon="my_location"
                :loading="gpsLoading[field.id]"
                no-caps
                size="sm"
                @click="acquireGps(field.id)"
              >
                {{ $t('location_acquire') }}
              </q-btn>
              <q-badge
                v-if="getLocationFieldModel(field.id).latitude"
                color="positive"
                class="q-pa-xs text-caption"
              >
                <q-icon name="check_circle" class="q-mr-xs" />
                {{ $t('location_captured') }} (±{{
                  getLocationFieldModel(field.id).accuracy || '?'
                }}m)
              </q-badge>
            </div>

            <div class="row q-col-gutter-sm q-pt-xs">
              <div class="col-6">
                <q-input
                  v-model.number="getLocationFieldModel(field.id).latitude"
                  type="number"
                  step="any"
                  label="Latitude"
                  outlined
                  dense
                  :dark="$q.dark.isActive"
                  :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="getLocationFieldModel(field.id).longitude"
                  type="number"
                  step="any"
                  label="Longitude"
                  outlined
                  dense
                  :dark="$q.dark.isActive"
                  :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
                />
              </div>
            </div>

            <p v-if="gpsError[field.id]" class="text-caption text-negative q-my-none">
              {{ gpsError[field.id] }}
            </p>

            <!-- Live Map Preview of Captured Location -->
            <div
              v-if="
                getLocationFieldModel(field.id).latitude &&
                getLocationFieldModel(field.id).longitude
              "
              class="q-mt-sm"
            >
              <MapView
                :singleLocation="{
                  latitude: Number(getLocationFieldModel(field.id).latitude),
                  longitude: Number(getLocationFieldModel(field.id).longitude),
                  accuracy: Number(getLocationFieldModel(field.id).accuracy || 0),
                }"
                height="200px"
              />
            </div>
          </div>

          <!-- Image Upload / Photo Capture Field -->
          <div v-if="field.type === 'image'" class="q-gutter-y-sm">
            <div v-if="formData[field.id]" class="relative-position inline-block">
              <img
                :src="String(formData[field.id])"
                alt="Uploaded photo"
                class="rounded-borders border"
                style="max-width: 100%; max-height: 200px; object-fit: contain"
              />
              <div class="q-mt-xs row items-center gap-2">
                <q-badge color="positive" class="q-pa-xs">
                  <q-icon name="photo" class="q-mr-xs" />
                  {{ $t('image_captured') }}
                </q-badge>
                <q-btn
                  color="negative"
                  flat
                  dense
                  icon="delete"
                  size="sm"
                  :label="$t('image_remove')"
                  no-caps
                  @click="formData[field.id] = ''"
                />
              </div>
            </div>

            <div v-else>
              <input
                :id="`file-input-${field.id}`"
                type="file"
                accept="image/*"
                capture="environment"
                style="display: none"
                @change="(e) => handleImageUpload(e, field.id)"
              />
              <q-btn
                color="indigo-6"
                icon="photo_camera"
                no-caps
                size="sm"
                @click="triggerFileInput(field.id)"
              >
                {{ $t('image_select') }}
              </q-btn>
            </div>
          </div>
        </q-card>
      </template>
    </div>

    <div class="row justify-end q-gutter-sm q-pt-md">
      <q-btn
        type="button"
        flat
        :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
        :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
        class="text-weight-bold"
        no-caps
        @click="$emit('cancel')"
      >
        {{ $t('cancel') }}
      </q-btn>
      <q-btn type="submit" color="primary" class="text-weight-bold q-px-md" no-caps icon="save">
        {{ $t('btn_save_entry') }}
      </q-btn>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormField, TemplateDoc } from '../composables/useDatabase';
import MapView from './MapView.vue';

interface LocationData {
  latitude: number | '';
  longitude: number | '';
  accuracy?: number;
}

const props = defineProps<{
  template: TemplateDoc;
  initialData?: Record<string, unknown> | undefined;
}>();

const emit = defineEmits<{
  (e: 'save', data: Record<string, unknown>): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const formData = ref<Record<string, unknown>>({});
const gpsLoading = ref<Record<string, boolean>>({});
const gpsError = ref<Record<string, string>>({});

const getTextFieldModel = (id: string) => {
  return computed({
    get: () => {
      const val = formData.value[id];
      return typeof val === 'string' || typeof val === 'number' ? String(val) : '';
    },
    set: (val) => {
      formData.value[id] = val;
    },
  });
};

const getArrayFieldModel = (id: string) => {
  return computed({
    get: () => {
      const val = formData.value[id];
      return Array.isArray(val) ? (val as string[]) : [];
    },
    set: (val) => {
      formData.value[id] = val;
    },
  });
};

const getNumberFieldModel = (id: string) => {
  return computed({
    get: () => {
      const val = formData.value[id];
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val !== '') {
        const num = Number(val);
        return isNaN(num) ? '' : num;
      }
      return '';
    },
    set: (val) => {
      formData.value[id] = val;
    },
  });
};

const getLocationFieldModel = (id: string): LocationData => {
  if (!formData.value[id] || typeof formData.value[id] !== 'object') {
    formData.value[id] = { latitude: '', longitude: '', accuracy: undefined };
  }
  return formData.value[id] as LocationData;
};

// Initialize form data when template or initialData changes
watchEffect(() => {
  const defaultData: Record<string, unknown> = {};
  props.template.fields.forEach((field) => {
    if (field.type === 'section') return;

    if (props.initialData && props.initialData[field.id] !== undefined) {
      defaultData[field.id] = props.initialData[field.id];
    } else {
      // Sensible defaults based on type
      if (field.type === 'boolean') defaultData[field.id] = false;
      else if (field.type === 'number') defaultData[field.id] = '';
      else if (field.type === 'multiselect') defaultData[field.id] = [];
      else if (field.type === 'location')
        defaultData[field.id] = { latitude: '', longitude: '', accuracy: undefined };
      else if (field.type === 'select') defaultData[field.id] = field.options?.[0]?.value || '';
      else defaultData[field.id] = '';
    }
  });
  formData.value = defaultData;
});

// GPS Acquisition via Browser Geolocation API
const acquireGps = (fieldId: string) => {
  if (!navigator.geolocation) {
    gpsError.value[fieldId] = t('location_error');
    return;
  }

  gpsLoading.value[fieldId] = true;
  gpsError.value[fieldId] = '';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsLoading.value[fieldId] = false;
      formData.value[fieldId] = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      };
    },
    (err) => {
      gpsLoading.value[fieldId] = false;
      console.warn('Geolocation error:', err);
      gpsError.value[fieldId] = `${t('location_error')} (${err.message})`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
};

// Image Upload / Camera Handling
const triggerFileInput = (fieldId: string) => {
  const el = document.getElementById(`file-input-${fieldId}`) as HTMLInputElement;
  if (el) el.click();
};

const handleImageUpload = (event: Event, fieldId: string) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Compress and resize image to max 800px width/height
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 800;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height *= MAX_SIZE / width));
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width *= MAX_SIZE / height));
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG quality 0.75 for lean offline sync
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        formData.value[fieldId] = base64;
      }
    };
    img.src = e.target?.result as string;
  };

  reader.readAsDataURL(file);
};

// Evaluates whether a field's condition is met
const checkCondition = (field: FormField): boolean => {
  if (!field.conditions || field.conditions.length === 0) return true;

  return field.conditions.every((cond) => {
    const dependentValue = formData.value[cond.field];
    if (cond.operator === 'equals') {
      return dependentValue === cond.value;
    }
    if (cond.operator === 'not_equals') {
      return dependentValue !== cond.value;
    }
    return true;
  });
};

// Reset values of hidden fields when conditions change
watch(
  () => ({ ...formData.value }),
  () => {
    props.template.fields.forEach((field) => {
      if (field.type !== 'section' && !checkCondition(field)) {
        if (field.type === 'boolean' && formData.value[field.id] !== false) {
          formData.value[field.id] = false;
        } else if (field.type === 'multiselect') {
          formData.value[field.id] = [];
        } else if (formData.value[field.id] !== '') {
          formData.value[field.id] = '';
        }
      }
    });
  },
  { deep: true },
);

const getRules = (field: FormField) => {
  const rules: ((val: unknown) => boolean | string)[] = [];

  if (field.required) {
    rules.push((val) => {
      if (field.type === 'multiselect') {
        const isOk = Array.isArray(val) && val.length > 0;
        return isOk || `${field.label} ${t('val_required')}`;
      }
      if (field.type === 'location') {
        const loc = val as LocationData | undefined;
        const isOk = !!(loc && loc.latitude !== '' && loc.longitude !== '');
        return isOk || `${field.label} ${t('val_required')}`;
      }
      const isOk = val !== undefined && val !== null && val !== '';
      return isOk || `${field.label} ${t('val_required')}`;
    });
  }

  if (field.type === 'number') {
    rules.push((val) => {
      if (val === undefined || val === null || val === '') return true;
      const numValue = Number(val);
      if (isNaN(numValue)) {
        return `${field.label} ${t('val_number')}`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} ${t('val_min')} ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} ${t('val_max')} ${field.validation.max}`;
      }
      return true;
    });
  }

  if (field.type === 'text' || field.type === 'textarea') {
    rules.push((val) => {
      if (val === undefined || val === null || val === '') return true;
      const strLen =
        typeof val === 'string' ? val.length : typeof val === 'number' ? String(val).length : 0;
      if (field.validation?.min_length !== undefined && strLen < field.validation.min_length) {
        return `${field.label} ${field.validation.min_length} chars min`;
      }
      if (field.validation?.max_length !== undefined && strLen > field.validation.max_length) {
        return `${field.label} ${field.validation.max_length} chars max`;
      }
      return true;
    });
  }

  return rules;
};

const onSubmit = () => {
  const cleanData: Record<string, unknown> = {};
  props.template.fields.forEach((field) => {
    if (field.type !== 'section' && checkCondition(field)) {
      cleanData[field.id] = formData.value[field.id];
    }
  });
  emit('save', cleanData);
};
</script>
