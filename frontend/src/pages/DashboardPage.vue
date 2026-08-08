<template>
  <div
    :dir="currentDir"
    class="window-height column justify-between overflow-hidden relative-position"
  >
    <!-- 1. UNAUTHENTICATED / DIRECT ACCESS SCREEN -->
    <div
      v-if="!token || !user"
      class="col column items-center justify-center q-px-md relative-position"
      style="z-index: 10"
    >
      <q-card
        bordered
        class="q-pa-xl relative-position glass-card"
        style="max-width: 440px; width: 100%; z-index: 10; border-radius: 20px"
      >
        <div class="text-center q-mb-lg q-pt-sm">
          <q-avatar
            size="64px"
            class="q-mb-md glow-primary"
            style="
              background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
              border-radius: 16px;
            "
          >
            <q-icon name="security" color="white" size="36px" />
          </q-avatar>
          <h1 class="text-h5 text-bold q-my-none" style="letter-spacing: -0.02em">
            {{ $t('app_title') }} - {{ $t('dashboard') }}
          </h1>
          <p class="text-caption text-grey-5 q-mt-xs q-mb-none" style="font-size: 0.85rem">
            {{ $t('dashboard_desc') }}
          </p>
        </div>

        <p class="text-caption text-center text-grey-5 q-mb-md">
          Please log in on the main page to access the Dashboard.
        </p>

        <q-btn
          color="primary"
          class="full-width"
          label="Go to Login / Main Page"
          no-caps
          @click="router.push('/')"
        />
      </q-card>
    </div>

    <!-- 2. AUTHENTICATED DASHBOARD WORKSPACE -->
    <template v-else>
      <!-- Top Navbar -->
      <div
        class="q-px-lg q-py-md row items-center justify-between glass-header"
        :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'"
        style="z-index: 20"
      >
        <div class="row items-center cursor-pointer" style="gap: 12px" @click="router.push('/')">
          <q-avatar
            size="36px"
            color="primary"
            text-color="white"
            class="text-weight-bold shadow-1"
            style="
              background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
              border-radius: 10px;
            "
          >
            HS
          </q-avatar>
          <div class="text-left">
            <h1
              class="text-subtitle1 text-bold q-my-none leading-none"
              style="letter-spacing: -0.01em"
            >
              HumanitySync
            </h1>
            <span
              class="text-caption text-indigo-4 text-weight-bold row items-center q-mt-xs"
              style="font-size: 0.75rem"
            >
              <q-icon name="space_dashboard" size="12px" class="q-mr-xs" />
              Permanent Dashboard URL (/dashboard)
            </span>
          </div>
        </div>

        <!-- Right Controls -->
        <div class="row items-center q-gutter-x-md">
          <!-- Network Status -->
          <div class="row items-center" style="gap: 6px">
            <span class="text-caption text-grey-5 hidden-xs">{{ $t('network') }}:</span>
            <q-badge
              :color="isOnline ? 'positive' : 'negative'"
              class="text-weight-bold q-px-sm q-py-xs shadow-1"
              style="border-radius: 9999px; font-size: 0.75rem"
            >
              <q-icon :name="isOnline ? 'wifi' : 'wifi_off'" size="12px" class="q-mr-xs" />
              {{ isOnline ? $t('online') : $t('offline') }}
            </q-badge>
          </div>

          <!-- DevTools Simulator -->
          <q-btn
            dense
            no-caps
            flat
            color="warning"
            :class="[
              $q.dark.isActive ? 'bg-grey-9 text-amber-3' : 'bg-amber-1 text-amber-10',
              'q-px-sm rounded-borders text-caption text-weight-bold border',
            ]"
            icon="tune"
            :label="$t('sim_btn_header')"
            @click="showSimulatorModal = true"
          />

          <!-- Theme Switcher -->
          <q-btn
            flat
            round
            dense
            :color="$q.dark.isActive ? 'white' : 'grey-8'"
            :icon="isDark ? 'light_mode' : 'dark_mode'"
            @click="toggleTheme"
          />

          <!-- Language Selector -->
          <q-btn-dropdown
            dense
            no-caps
            flat
            :color="$q.dark.isActive ? 'white' : 'grey-8'"
            :class="[
              $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3',
              'q-px-sm rounded-borders font-bold text-xs',
            ]"
            :label="languages.find((l) => l.code === locale)?.flag + ' ' + locale.toUpperCase()"
          >
            <q-list :dark="$q.dark.isActive" style="min-width: 150px">
              <q-item
                v-for="lang in languages"
                :key="lang.code"
                clickable
                v-close-popup
                :active="locale === lang.code"
                active-class="text-indigo-4 bg-indigo-opacity"
                @click="setLanguage(lang.code)"
              >
                <q-item-section avatar class="q-min-w-0 q-pr-sm">
                  <span>{{ lang.flag }}</span>
                </q-item-section>
                <q-item-section class="text-caption">{{ lang.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- User Info & Field Navigation Button -->
          <div class="row items-center border-s q-pl-md q-gutter-x-sm">
            <div class="text-right hidden-xs">
              <span class="block text-caption text-weight-bold">{{ user?.name }}</span>
              <span class="block text-caption text-grey-5" style="font-family: monospace">
                {{ user?.role === 'project_manager' ? $t('role_admin') : $t('role_surveyor') }}
              </span>
            </div>

            <!-- Switch to Field View -->
            <q-btn
              color="secondary"
              outline
              class="text-weight-bold"
              dense
              no-caps
              icon="assignment"
              label="Field Assessment View"
              @click="router.push('/')"
            />

            <!-- Logout -->
            <q-btn
              flat
              round
              :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
              icon="logout"
              size="sm"
              :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
              @click="handleLogout"
            />
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content -->
      <main class="col q-pa-lg row justify-center overflow-auto">
        <div class="col-12" style="max-width: 1280px">
          <AdminDashboard
            :submissions="adminSubmissions"
            :templates="templates"
            :token="token!"
            @templateCreated="loadDashboardData"
            @refreshSubmissions="loadDashboardData"
            @back="router.push('/')"
          />
        </div>
      </main>

      <!-- Footer -->
      <footer
        class="q-py-sm q-px-lg text-center text-caption text-grey-6 border-t glass-header"
        :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'"
      >
        <span>{{ $t('footer') }}</span>
      </footer>
    </template>

    <!-- Simulator Modal -->
    <q-dialog v-model="showSimulatorModal">
      <SimulatorPanel
        :is-online="isOnline"
        :sync-status="syncStatus"
        :sync-error="syncError"
        :surveyor-id="user?.name || 'admin'"
        @toggle-network="isOnline = $event"
        @refresh="loadDashboardData"
      />
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

import { useDatabase } from '../composables/useDatabase';
import type { SubmissionDoc } from '../composables/useDatabase';
import { useAuthStore } from '../stores/authStore';
import AdminDashboard from '../components/AdminDashboard.vue';
import SimulatorPanel from '../components/SimulatorPanel.vue';

const router = useRouter();
const $q = useQuasar();
const isDark = ref(localStorage.getItem('theme') !== 'light');
$q.dark.set(isDark.value);

const showSimulatorModal = ref(false);
const isOnline = ref(navigator.onLine);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  $q.dark.set(isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const i18n = useI18n();
const { locale } = i18n;

interface LanguageConfig {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇮🇶' },
  { code: 'ku', name: 'Kurmancî', dir: 'ltr', flag: '☀️' },
  { code: 'ckb', name: 'سۆرانی', dir: 'rtl', flag: '☀️' },
];

const currentLanguage = computed(() => languages.find((l) => l.code === locale.value));
const currentDir = computed(() => currentLanguage.value?.dir || 'ltr');

const setLanguage = (code: string) => {
  locale.value = code;
};

const authStore = useAuthStore();
const token = computed(() => authStore.token);
const user = computed(() => authStore.user);

const { dbWrapper, syncStatus, syncError, templates, fetchTemplates } = useDatabase();
const adminSubmissions = ref<SubmissionDoc[]>([]);

const loadDashboardData = async () => {
  try {
    await fetchTemplates();
    const response = await axios.get<{ submissions: SubmissionDoc[] }>('/api/admin/submissions');
    if (dbWrapper.value) {
      adminSubmissions.value = response.data.submissions.map((doc) =>
        dbWrapper.value!.decryptDocument(doc),
      );
    } else {
      adminSubmissions.value = response.data.submissions;
    }
  } catch (err) {
    console.error('Failed to fetch admin data:', err);
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};

onMounted(async () => {
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    await loadDashboardData();
  }
});
</script>
