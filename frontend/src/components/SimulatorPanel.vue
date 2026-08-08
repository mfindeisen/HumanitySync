<template>
  <q-card bordered class="q-pa-md text-left">
    <!-- Header -->
    <div class="row items-center justify-between q-pb-md q-mb-sm flex-wrap gap-2">
      <div>
        <h3 class="text-subtitle1 text-bold q-my-none row items-center">
          <q-icon name="flash_on" color="warning" size="20px" class="q-mr-xs" />
          {{ $t('sim_title') }}
        </h3>
        <p class="text-caption text-grey-5 q-my-none">{{ $t('sim_desc') }}</p>
      </div>

      <!-- Network Status Toggle Button -->
      <q-btn
        dense
        no-caps
        unelevated
        :color="isOnline ? 'positive' : 'negative'"
        class="text-weight-bold q-px-sm"
        @click="toggleNetwork"
      >
        <q-icon
          :name="isOnline ? 'wifi' : 'wifi_off'"
          size="16px"
          class="q-mr-xs"
          :class="{ 'animate-pulse': isOnline }"
        />
        {{ isOnline ? $t('online') : $t('offline') }}
      </q-btn>
    </div>
    <q-separator class="q-mb-md" />

    <!-- Simulator Buttons -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Ampere Reboot -->
      <div class="col-6">
        <q-btn
          stack
          outline
          color="warning"
          class="full-width text-weight-bold q-py-md"
          :loading="simulatingAmpere"
          no-caps
          @click="handleSimulateAmpere"
        >
          <template v-slot:loading>
            <q-icon name="flash_off" class="animate-bounce q-mb-xs" color="warning" size="20px" />
            <span class="text-caption text-weight-bold">
              {{ $t('router_reboot_log', { seconds: ampereCountdown }) }}
            </span>
          </template>
          <q-icon name="flash_on" color="warning" size="20px" class="q-mb-xs" />
          <span class="text-caption text-weight-bold">{{ $t('ampere_btn') }}</span>
          <span class="text-caption text-grey-5 q-mt-xs">{{ $t('ampere_desc') }}</span>
        </q-btn>
      </div>

      <!-- Generate Conflict -->
      <div class="col-6">
        <q-btn
          stack
          outline
          color="blue"
          class="full-width text-weight-bold q-py-md"
          :loading="conflictLoading"
          no-caps
          @click="handleSimulateConflict"
        >
          <template v-slot:loading>
            <q-spinner-oval color="blue" size="20px" class="q-mb-xs" />
            <span class="text-caption text-weight-bold">{{ $t('conflict_btn') }}...</span>
          </template>
          <q-icon name="play_arrow" color="blue" size="20px" class="q-mb-xs" />
          <span class="text-caption text-weight-bold">{{ $t('conflict_btn') }}</span>
          <span class="text-caption text-grey-5 q-mt-xs">{{ $t('conflict_desc') }}</span>
        </q-btn>
      </div>
    </div>

    <!-- Sync Info -->
    <div
      :class="$q.dark.isActive ? 'bg-black border-grey-9' : 'bg-grey-2 border-grey-4'"
      class="q-pa-sm rounded-borders border q-mb-md text-caption q-gutter-y-xs text-grey-5"
    >
      <div class="row justify-between items-center">
        <span>{{ $t('replication_status') }}</span>
        <q-badge
          :color="getSyncBadgeColor()"
          class="text-bold q-px-sm q-py-xs text-caption uppercase"
        >
          {{ $t(`sync_${syncStatus}`) }}
        </q-badge>
      </div>
      <div v-if="syncError" class="text-red text-caption row items-start q-mt-sm">
        <q-icon name="error" color="red" size="14px" class="q-mr-xs q-mt-xs" />
        <span class="col">{{ $t('error_label') }} {{ getErrorMessage(syncError) }}</span>
      </div>
    </div>

    <!-- Console Logging -->
    <div :class="$q.dark.isActive ? 'bg-black' : 'bg-grey-2'" class="q-pa-sm rounded-borders">
      <div class="text-caption text-grey-6 text-bold q-mb-sm">
        {{ $t('console_title') }}
      </div>
      <div
        :class="[
          'text-caption q-py-xs',
          $q.dark.isActive ? 'text-blue-grey-3' : 'text-blue-grey-9',
        ]"
        style="font-family: monospace; max-height: 150px; overflow-y: auto"
      >
        <div v-for="(log, idx) in simLog" :key="idx" :class="getLogClass(log)" class="q-mb-xs">
          {{ log }}
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import PouchDB from 'pouchdb';

const props = defineProps<{
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'paused' | 'error';
  syncError: unknown;
  surveyorId: string;
}>();

const emit = defineEmits<{
  (e: 'toggleNetwork', online: boolean): void;
  (e: 'refresh'): void;
}>();

const { t } = useI18n();

const simulatingAmpere = ref(false);
const ampereCountdown = ref(0);
const conflictLoading = ref(false);
const simLog = ref<string[]>([]);

onMounted(() => {
  simLog.value = [t('sim_init')];
});

watch(
  () => t('sim_init'),
  () => {
    simLog.value = [t('sim_init')];
  },
);

const addLog = (msg: string) => {
  const time = new Date().toLocaleTimeString();
  simLog.value = [`[${time}] ${msg}`, ...simLog.value.slice(0, 8)];
};

const toggleNetwork = () => {
  emit('toggleNetwork', !props.isOnline);
  addLog(props.isOnline ? t('net_off_log') : t('net_on_log'));
};

const handleSimulateAmpere = () => {
  if (simulatingAmpere.value) return;

  simulatingAmpere.value = true;
  emit('toggleNetwork', false);
  addLog(t('power_outage_log', { user: props.surveyorId || t('role_surveyor') }));

  let count = 4;
  ampereCountdown.value = count;

  const timer = setInterval(() => {
    count--;
    ampereCountdown.value = count;

    if (count === 0) {
      clearInterval(timer);
      emit('toggleNetwork', true);
      simulatingAmpere.value = false;
      addLog(t('network_back_log'));
    } else {
      addLog(t('router_reboot_log', { seconds: count }));
    }
  }, 1000);
};

const handleSimulateConflict = async () => {
  conflictLoading.value = true;
  addLog(t('conflict_init_log'));

  try {
    const docId = `submission:needs_assessment_v1:conflict-demo-doc`;
    const remoteDbUrl = `${window.location.origin}/db/humanitysync`;

    addLog(t('conflict_step1_log'));

    // Delete if exists on remote
    let baseRev = '';
    try {
      const checkRes = await axios.get(`${remoteDbUrl}/${docId}`);
      baseRev = checkRes.data._rev;
      await axios.delete(`${remoteDbUrl}/${docId}?rev=${baseRev}`);
      addLog(t('conflict_step1_old_deleted'));
    } catch {
      // Doc didn't exist
    }

    // Save base doc on remote
    const baseDoc = {
      _id: docId,
      type: 'submission',
      template_id: 'template:needs_assessment_v1',
      status: 'completed',
      sync_state: { synced: true, device_id: 'simulator' },
      metadata: {
        surveyor_id: props.surveyorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      data: {
        family_head_name: 'Simulierter Konflikt',
        family_size: 4,
        has_infants: false,
        shelter_condition: 'good',
      },
    };

    const putRes = await axios.put<{ rev: string }>(`${remoteDbUrl}/${docId}`, baseDoc);
    const activeRev = putRes.data.rev;
    addLog(t('conflict_step1_saved', { rev: activeRev.substring(0, 8) }));

    // Device B updating Remote Doc
    addLog(t('conflict_step2_log'));
    const remoteUpdate = {
      ...baseDoc,
      _rev: activeRev,
      data: {
        ...baseDoc.data,
        family_size: 10,
        shelter_condition: 'critical',
      },
      metadata: {
        ...baseDoc.metadata,
        updated_at: new Date().toISOString(),
      },
    };
    const remoteRes = await axios.put<{ rev: string }>(`${remoteDbUrl}/${docId}`, remoteUpdate);
    const remoteRev = remoteRes.data.rev;
    addLog(t('conflict_step2_saved', { rev: remoteRev.substring(0, 8) }));

    // Device A updating Local Doc
    addLog(t('conflict_step3_log'));
    const localUpdate = {
      _id: docId,
      _rev: activeRev, // Divering from the same parent base rev
      type: 'submission',
      template_id: 'template:needs_assessment_v1',
      status: 'completed',
      sync_state: { synced: false, device_id: 'local_tablet' },
      metadata: {
        surveyor_id: props.surveyorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      data: {
        family_head_name: 'Simulierter Konflikt',
        family_size: 2,
        shelter_condition: 'damaged',
      },
    };

    // Go offline temporarily
    emit('toggleNetwork', false);

    const localDb = new PouchDB('humanitysync');
    try {
      await localDb.put(localUpdate);
    } catch {
      try {
        const ldoc = await localDb.get<{ _rev: string }>(docId);
        await localDb.put({ ...localUpdate, _rev: ldoc._rev });
      } catch {
        await localDb.put(localUpdate);
      }
    }

    addLog(t('conflict_step3_saved'));
    addLog(t('conflict_step4_log'));

    setTimeout(() => {
      emit('toggleNetwork', true);
      addLog(t('conflict_step4_sync_started'));
      setTimeout(() => {
        emit('refresh');
        addLog(t('conflict_step4_success'));
      }, 1500);
    }, 1000);
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    addLog(t('conflict_error_log', { msg }));
  }
};

const getSyncBadgeColor = () => {
  if (props.syncStatus === 'syncing') return 'blue';
  if (props.syncStatus === 'paused') return 'warning';
  if (props.syncStatus === 'error') return 'negative';
  return 'positive';
};

const getLogClass = (log: string) => {
  if (log.includes('❌')) return 'text-red';
  if (log.includes('⚡')) return 'text-amber';
  if (log.includes('🔍')) return 'text-cyan';
  return 'text-grey-5';
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return JSON.stringify(error);
};
</script>
