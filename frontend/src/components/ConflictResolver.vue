<template>
  <div class="q-gutter-y-md text-left">
    <!-- Loading State -->
    <div v-if="loading" class="column items-center justify-center q-py-xl">
      <q-spinner color="indigo-5" size="3em" />
      <p class="q-mt-md text-grey-5 text-caption">{{ $t('loading_conflicts') }}</p>
    </div>

    <!-- Error State -->
    <q-banner
      v-else-if="error"
      rounded
      class="text-center"
      :class="$q.dark.isActive ? 'bg-red-10 text-red-3' : 'bg-red-1 text-red-9'"
    >
      <template v-slot:avatar>
        <q-icon name="warning" color="negative" size="2em" />
      </template>
      <p
        class="text-weight-bold q-my-none"
        :class="$q.dark.isActive ? 'text-white' : 'text-grey-9'"
      >
        {{ error }}
      </p>
      <q-btn
        :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
        :text-color="$q.dark.isActive ? 'white' : 'grey-9'"
        class="q-mt-md text-weight-bold"
        no-caps
        @click="$emit('cancel')"
      >
        {{ $t('back_btn') }}
      </q-btn>
    </q-banner>

    <!-- No Active Conflicts -->
    <div v-else-if="!localVersion || conflictingVersions.length === 0" class="text-center q-py-xl">
      <p class="text-grey-5">{{ $t('no_active_conflicts') }}</p>
      <q-btn
        :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
        :text-color="$q.dark.isActive ? 'white' : 'grey-9'"
        no-caps
        class="q-mt-md"
        @click="$emit('cancel')"
      >
        {{ $t('back_btn') }}
      </q-btn>
    </div>

    <!-- Conflict Resolver Main UI -->
    <div v-else class="q-gutter-y-md">
      <q-banner
        rounded
        class="q-pa-md"
        :class="$q.dark.isActive ? 'text-white bg-orange-9' : 'text-black bg-amber-3'"
      >
        <template v-slot:avatar>
          <q-icon name="warning" color="warning" size="24px" />
        </template>
        <div class="text-weight-bold">{{ $t('sync_conflict_detected') }}</div>
        <div class="text-caption" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-9'">
          {{ $t('conflict_resolver_desc') }}
        </div>
      </q-banner>

      <!-- Conflicts Table -->
      <q-card bordered class="overflow-hidden">
        <q-markup-table :dark="$q.dark.isActive" flat style="background-color: transparent">
          <thead>
            <tr :class="$q.dark.isActive ? 'bg-black' : 'bg-grey-2'">
              <th class="text-left text-grey-5 text-caption text-bold">
                {{ $t('table_col_field') }}
              </th>
              <th class="text-left text-red text-caption text-bold">{{ $t('table_col_local') }}</th>
              <th class="text-left text-blue text-caption text-bold">
                {{ $t('table_col_remote') }}
              </th>
              <th
                class="text-left text-caption text-bold"
                :class="$q.dark.isActive ? 'text-grey-2' : 'text-grey-9'"
              >
                {{ $t('table_col_resolution') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="field in template.fields"
              :key="field.id"
              :class="{ 'bg-amber-1': isDifferent(field.id) }"
            >
              <!-- Field Details -->
              <td class="text-left">
                <span
                  class="block text-subtitle2 text-bold"
                  :class="$q.dark.isActive ? 'text-grey-2' : 'text-grey-9'"
                  >{{ field.label }}</span
                >
                <span class="text-caption text-grey-6" style="font-family: monospace">{{
                  field.id
                }}</span>
              </td>

              <!-- Local Version -->
              <td class="text-left">
                <span
                  class="q-px-sm q-py-xs rounded-borders text-caption"
                  :class="
                    isDifferent(field.id)
                      ? $q.dark.isActive
                        ? 'bg-red-10 text-red-3'
                        : 'bg-red-1 text-red-9'
                      : 'text-grey-5'
                  "
                >
                  {{ formatValue(field, localVersion.data[field.id]) }}
                </span>
              </td>

              <!-- Remote Version -->
              <td class="text-left">
                <span
                  class="q-px-sm q-py-xs rounded-borders text-caption"
                  :class="
                    isDifferent(field.id)
                      ? $q.dark.isActive
                        ? 'bg-blue-10 text-blue-3'
                        : 'bg-blue-1 text-blue-9'
                      : 'text-grey-5'
                  "
                >
                  {{ formatValue(field, remoteVersion.data[field.id]) }}
                </span>
              </td>

              <!-- Resolution Choice -->
              <td class="text-left">
                <div v-if="isDifferent(field.id)" class="column q-gutter-y-sm">
                  <q-btn-toggle
                    v-model="selectedResolutions[field.id]"
                    toggle-color="indigo-5"
                    :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                    :text-color="$q.dark.isActive ? 'white' : 'grey-9'"
                    :dark="$q.dark.isActive"
                    dense
                    no-caps
                    unelevated
                    :options="[
                      { label: $t('btn_local'), value: 'local' },
                      { label: $t('btn_remote'), value: 'remote' },
                      { label: $t('btn_edit'), value: 'custom' },
                    ]"
                  />

                  <!-- Custom values inputs -->
                  <div v-if="selectedResolutions[field.id] === 'custom'" class="q-mt-xs">
                    <q-toggle
                      v-if="field.type === 'boolean'"
                      v-model="getToggleFieldModel(field.id).value"
                      color="indigo-5"
                      :dark="$q.dark.isActive"
                      dense
                      :label="getToggleFieldModel(field.id).value ? $t('yes') : $t('no')"
                    />
                    <q-input
                      v-else
                      v-model="getCustomFieldModel(field.id).value"
                      :type="field.type === 'number' ? 'number' : 'text'"
                      outlined
                      dense
                      :dark="$q.dark.isActive"
                      color="indigo-5"
                      :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
                      :placeholder="$t('custom_value_placeholder')"
                    />
                  </div>
                </div>
                <div v-else class="row items-center text-grey-6 text-caption">
                  <q-icon name="check_box" color="positive" size="18px" class="q-mr-xs" />
                  {{ $t('identical') }}
                </div>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>

      <!-- Action Footer -->
      <q-separator class="q-my-md" />
      <div class="row justify-between items-center q-pt-sm flex-wrap gap-4">
        <div class="text-caption text-grey-5">
          {{ $t('comparison_label') }}
          <span class="text-grey-4" style="font-family: monospace">{{
            localVersion._rev?.substring(0, 8)
          }}</span>
          (A) vs.
          <span class="text-grey-4" style="font-family: monospace">{{
            remoteVersion._rev?.substring(0, 8)
          }}</span>
          (B)
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            flat
            :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
            :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
            class="text-weight-bold"
            no-caps
            @click="$emit('cancel')"
          >
            {{ $t('cancel') }}
          </q-btn>
          <q-btn
            color="warning"
            text-color="black"
            class="text-weight-bold q-px-md"
            no-caps
            icon="save"
            @click="handleSaveResolution"
          >
            {{ $t('save_resolution') }}
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDatabase } from '../composables/useDatabase';
import type { SubmissionDoc, TemplateDoc, FormField } from '../composables/useDatabase';

const props = defineProps<{
  conflictDoc: SubmissionDoc;
  template: TemplateDoc;
}>();

const emit = defineEmits<{
  (e: 'resolved'): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const { dbWrapper } = useDatabase();

const localVersion = ref<SubmissionDoc | null>(null);
const conflictingVersions = ref<SubmissionDoc[]>([]);
const selectedResolutions = ref<Record<string, 'local' | 'remote' | 'custom'>>({});
const customValues = ref<Record<string, string | number | boolean>>({});

const getCustomFieldModel = (id: string) => {
  return computed({
    get: () => {
      const val = customValues.value[id];
      return typeof val === 'string' || typeof val === 'number' ? val : '';
    },
    set: (val) => {
      customValues.value[id] = val;
    },
  });
};

const getToggleFieldModel = (id: string) => {
  return computed({
    get: () => {
      const val = customValues.value[id];
      return typeof val === 'boolean' ? val : false;
    },
    set: (val) => {
      customValues.value[id] = val;
    },
  });
};

const loading = ref(true);
const error = ref<string | null>(null);

const remoteVersion = computed<SubmissionDoc>(() => {
  if (conflictingVersions.value.length === 0 || !conflictingVersions.value[0]) {
    return {
      _id: '',
      type: 'submission',
      template_id: '',
      status: 'completed',
      sync_state: { synced: false, device_id: '' },
      metadata: { surveyor_id: '', created_at: '', updated_at: '' },
      data: {},
    };
  }
  return conflictingVersions.value[0];
});

onMounted(async () => {
  await loadConflictVersions();
});

const loadConflictVersions = async () => {
  if (!dbWrapper.value) {
    error.value = 'Database not initialized';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    // 1. Fetch current local winner
    const local = await dbWrapper.value.get(props.conflictDoc._id);
    localVersion.value = local as unknown as SubmissionDoc;

    // 2. Fetch the conflicting revisions
    if (props.conflictDoc._conflicts && props.conflictDoc._conflicts.length > 0) {
      const fetchPromises = props.conflictDoc._conflicts.map(async (rev) => {
        try {
          return (await dbWrapper.value!.get(props.conflictDoc._id, {
            rev,
          })) as unknown as SubmissionDoc;
        } catch (err) {
          console.error(`Failed to fetch rev ${rev}:`, err);
          return null;
        }
      });

      const fetched = await Promise.all(fetchPromises);
      const validDocs = fetched.filter((d): d is SubmissionDoc => d !== null);
      conflictingVersions.value = validDocs;

      // Pre-initialize resolutions
      const initialResolutions: Record<string, 'local' | 'remote' | 'custom'> = {};
      props.template.fields.forEach((field) => {
        initialResolutions[field.id] = 'local';
      });
      selectedResolutions.value = initialResolutions;
    } else {
      error.value = t('no_conflicts_found');
    }
  } catch (err: unknown) {
    console.error(err);
    error.value = t('error_loading_conflicts');
  } finally {
    loading.value = false;
  }
};

const isDifferent = (fieldId: string) => {
  if (!localVersion.value || conflictingVersions.value.length === 0) return false;
  const localVal = localVersion.value.data[fieldId];
  const remoteVal = remoteVersion.value.data[fieldId];
  return JSON.stringify(localVal) !== JSON.stringify(remoteVal);
};

const formatValue = (field: FormField, val: unknown) => {
  if (val === undefined || val === null || val === '') return '-';
  if (field.type === 'boolean') {
    return val ? t('yes') : t('no');
  }
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  return JSON.stringify(val);
};

const handleSaveResolution = async () => {
  if (!localVersion.value || conflictingVersions.value.length === 0 || !dbWrapper.value) return;

  try {
    const resolvedData: Record<string, unknown> = {};
    const remoteDoc = remoteVersion.value;

    props.template.fields.forEach((field) => {
      const choice = selectedResolutions.value[field.id];
      if (choice === 'local') {
        resolvedData[field.id] = localVersion.value!.data[field.id];
      } else if (choice === 'remote') {
        resolvedData[field.id] = remoteDoc.data[field.id];
      } else {
        resolvedData[field.id] =
          customValues.value[field.id] !== undefined
            ? customValues.value[field.id]
            : localVersion.value!.data[field.id];
      }
    });

    // Archive losing conflicting revisions non-destructively before purging MVCC branches
    const archivedConflicts = [
      ...(localVersion.value.archived_conflicts || []),
      ...conflictingVersions.value.map((conf) => ({
        rev: conf._rev,
        surveyor_id: conf.metadata?.surveyor_id,
        updated_at: conf.metadata?.updated_at,
        data: conf.data,
      })),
    ];

    const currentTrail = localVersion.value.metadata?.audit_trail || [];
    const auditEntry = {
      user_id: localVersion.value.metadata?.surveyor_id || 'user',
      action: 'conflict_resolved' as const,
      timestamp: new Date().toISOString(),
      note: `Resolved MVCC conflict between local revision ${localVersion.value._rev} and ${conflictingVersions.value.length} remote revision(s)`,
    };

    // 1. Create the merged document with non-destructive archived conflicts and audit log
    const resolvedDoc: SubmissionDoc = {
      ...localVersion.value,
      data: resolvedData,
      archived_conflicts: archivedConflicts,
      sync_state: {
        synced: false,
        device_id: localVersion.value.sync_state.device_id,
        last_attempt: new Date().toISOString(),
      },
      metadata: {
        ...localVersion.value.metadata,
        updated_at: new Date().toISOString(),
        audit_trail: [...currentTrail, auditEntry],
      },
    };

    // 2. Write the resolved version
    await dbWrapper.value.put(resolvedDoc as unknown as Record<string, unknown>);

    // 3. Clean up the resolved CouchDB conflict branches
    const rawDb = dbWrapper.value.getRawDb();
    for (const confDoc of conflictingVersions.value) {
      if (confDoc._rev) {
        await rawDb.remove(confDoc._id, confDoc._rev);
      }
    }

    emit('resolved');
  } catch (err: unknown) {
    console.error('Conflict resolution failed:', err);
    const msg = err instanceof Error ? err.message : String(err);
    error.value = t('error_resolving') + msg;
  }
};
</script>
