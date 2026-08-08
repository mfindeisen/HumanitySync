<template>
  <!-- Main Container -->
  <div
    :dir="currentDir"
    class="window-height column justify-between overflow-hidden relative-position"
  >
    <!-- 1. LOGIN SCREEN -->
    <div
      v-if="!token || !user"
      class="col column items-center justify-center q-px-md relative-position"
      style="z-index: 10"
    >
      <!-- Login Card -->
      <q-card
        bordered
        class="q-pa-xl relative-position glass-card"
        style="max-width: 440px; width: 100%; z-index: 10; border-radius: 20px"
      >
        <!-- Language & Theme Switcher inside login card -->
        <div
          class="absolute row items-center q-gutter-x-xs"
          :style="currentDir === 'rtl' ? 'top: 16px; left: 16px;' : 'top: 16px; right: 16px;'"
        >
          <q-btn
            flat
            round
            dense
            :color="$q.dark.isActive ? 'white' : 'grey-9'"
            :icon="isDark ? 'light_mode' : 'dark_mode'"
            @click="toggleTheme"
          />
          <q-btn-dropdown
            dense
            no-caps
            flat
            :color="$q.dark.isActive ? 'white' : 'grey-9'"
            :class="[
              $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3',
              'q-px-sm rounded-borders text-weight-bold text-xs',
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
        </div>

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
            {{ $t('app_title') }}
          </h1>
          <p class="text-caption text-grey-5 q-mt-xs q-mb-none" style="font-size: 0.85rem">
            {{ $t('app_subtitle') }}
          </p>
        </div>

        <!-- Auth Error Alert -->
        <q-banner
          v-if="authError"
          rounded
          class="q-mb-md text-caption row items-start no-wrap"
          :class="$q.dark.isActive ? 'bg-red-10 text-red-3' : 'bg-red-1 text-red-9'"
        >
          <template v-slot:avatar>
            <q-icon name="error" :color="$q.dark.isActive ? 'red-3' : 'red-9'" size="18px" />
          </template>
          <span>{{ authError }}</span>
        </q-banner>

        <!-- Login Form -->
        <q-form @submit="handleLogin" class="q-gutter-y-md">
          <div>
            <label
              class="text-caption text-grey-5 text-bold uppercase q-mb-xs"
              style="display: block; letter-spacing: 0.05em"
              >{{ $t('username') }}</label
            >
            <q-input
              v-model="usernameInput"
              outlined
              dense
              :dark="$q.dark.isActive"
              required
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="surveyor1"
            />
          </div>

          <div>
            <label
              class="text-caption text-grey-5 text-bold uppercase q-mb-xs"
              style="display: block; letter-spacing: 0.05em"
              >{{ $t('password') }}</label
            >
            <q-input
              v-model="passwordInput"
              type="password"
              outlined
              dense
              :dark="$q.dark.isActive"
              required
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="••••••••"
            />
          </div>

          <div class="row items-center text-caption text-grey-6 q-py-xs no-wrap">
            <q-icon name="lock" size="14px" class="q-mr-xs" />
            <span>{{ $t('db_encryption_hint') }}</span>
          </div>

          <q-btn
            type="submit"
            color="primary"
            class="full-width text-weight-bold text-white q-py-sm"
            no-caps
            :loading="authLoading"
          >
            {{ $t('login_title') }}
          </q-btn>
        </q-form>

        <template v-if="enableDemoLogins">
          <q-separator class="q-mt-xl" />
          <div class="q-pt-md text-center text-caption text-grey-6 q-gutter-y-xs">
            <p class="text-bold text-grey-5">{{ $t('demo_logins') }}</p>
            <p>
              {{ $t('role_surveyor') }}:
              <q-chip
                clickable
                dense
                color="indigo-1"
                text-color="indigo-9"
                class="text-weight-bold cursor-pointer q-mr-xs"
                @click="fillDemoCredentials('surveyor1', 'password')"
              >
                surveyor1
                <q-tooltip>Click to auto-fill</q-tooltip>
              </q-chip>
              |
              <q-chip
                clickable
                dense
                color="indigo-1"
                text-color="indigo-9"
                class="text-weight-bold cursor-pointer q-ml-xs"
                @click="fillDemoCredentials('surveyor2', 'password')"
              >
                surveyor2
                <q-tooltip>Click to auto-fill</q-tooltip>
              </q-chip>
            </p>
            <p>
              {{ $t('role_admin') }}:
              <q-chip
                clickable
                dense
                color="purple-1"
                text-color="purple-9"
                class="text-weight-bold cursor-pointer"
                @click="fillDemoCredentials('admin', 'admin')"
              >
                admin
                <q-tooltip>Click to auto-fill</q-tooltip>
              </q-chip>
            </p>
          </div>
        </template>
      </q-card>
    </div>

    <!-- 2. MAIN APP VIEW -->
    <div v-else class="col column relative-position" style="z-index: 10">
      <!-- Navbar -->
      <div
        class="q-px-lg q-py-md row items-center justify-between glass-header"
        :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'"
        style="z-index: 20"
      >
        <div class="row items-center" style="gap: 12px">
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
              class="text-caption text-positive text-weight-bold row items-center q-mt-xs"
              style="font-size: 0.75rem"
            >
              <span class="pulse-dot q-mr-xs" />
              {{ $t('encrypted_client') }}
            </span>
          </div>
        </div>

        <!-- Sync status pills, Language, Profile & Navigation -->
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

          <!-- Sync Status -->
          <div class="row items-center" style="gap: 6px">
            <span class="text-caption text-grey-5 hidden-xs">{{ $t('sync') }}:</span>
            <q-btn
              dense
              no-caps
              outline
              :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
              :class="[
                $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2',
                'text-weight-bold q-px-sm text-caption',
              ]"
              @click="handleManualSyncTrigger"
            >
              <q-icon
                name="autorenew"
                size="12px"
                class="q-mr-xs"
                :class="{ 'animate-spin': syncStatus === 'syncing' }"
              />
              {{ $t('sync') }}: {{ $t(`sync_${syncStatus}`) }}
            </q-btn>
          </div>

          <!-- DevTools / Infrastructure Simulator Trigger -->
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

          <div class="row items-center border-s q-pl-md q-gutter-x-sm">
            <div class="text-right hidden-xs">
              <span class="block text-caption text-weight-bold">{{ user?.name }}</span>
              <span class="block text-caption text-grey-5" style="font-family: monospace">
                {{ user?.role === 'project_manager' ? $t('role_admin') : $t('role_surveyor') }}
              </span>
            </div>

            <!-- Admin Dashboard Toggle Button -->
            <q-btn
              v-if="user?.role === 'project_manager' && view === 'field'"
              color="primary"
              class="text-weight-bold"
              dense
              no-caps
              label="Dashboard"
              @click="handleOpenAdmin"
            />

            <!-- Logout Button -->
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

      <!-- Main Layout Workspace Grid -->
      <main class="col q-pa-lg row justify-center overflow-auto">
        <div class="col-12 row q-col-gutter-md" style="max-width: 1280px">
          <!-- 2.1 ADMIN VIEW -->
          <div v-if="view === 'admin'" class="col-12 animate-fade-in">
            <AdminDashboard
              :submissions="adminSubmissions"
              :templates="templates"
              :token="token!"
              @templateCreated="loadLocalData"
              @refreshSubmissions="handleOpenAdmin"
              @back="view = 'field'"
            />
          </div>

          <!-- 2.2 FIELD / WORKER VIEW -->
          <template v-else>
            <!-- Left Column (Sidebar: Templates) -->
            <div class="col-12 col-md-4 col-lg-3 q-gutter-y-md animate-fade-in">
              <!-- Form Templates List -->
              <q-card bordered class="q-pa-md text-left">
                <h3 class="text-subtitle2 text-bold q-pb-sm q-mb-md q-my-none row items-center">
                  <q-icon name="assignment" color="primary" size="18px" class="q-mr-xs" />
                  {{ $t('templates_title') }}
                </h3>
                <q-separator class="q-mb-md" />

                <div
                  v-if="templates.length === 0"
                  class="text-center q-py-md text-caption text-grey-6"
                >
                  {{ $t('templates_loading') }}
                </div>

                <div v-else class="q-gutter-y-sm">
                  <q-btn
                    v-for="tmpl in templates"
                    :key="tmpl._id"
                    align="between"
                    outline
                    no-caps
                    :color="activeTemplate?._id === tmpl._id ? 'primary' : 'grey-7'"
                    :class="[
                      'full-width text-left q-pa-sm rounded-borders text-caption',
                      $q.dark.isActive ? 'text-grey-4' : 'text-grey-9',
                      activeTemplate?._id === tmpl._id
                        ? $q.dark.isActive
                          ? 'bg-grey-9'
                          : 'bg-grey-3'
                        : $q.dark.isActive
                          ? 'bg-black'
                          : 'bg-white',
                    ]"
                    @click="selectTemplate(tmpl)"
                  >
                    <div class="text-left col">
                      <span class="block text-subtitle2 text-bold">{{ tmpl.title }}</span>
                      <span class="text-caption text-grey-6 block q-mt-xs">
                        {{ $t('templates_info_version') }} {{ tmpl.version }} •
                        {{ tmpl.fields.length }} {{ $t('templates_info_fields') }}
                      </span>
                    </div>
                    <q-badge
                      :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
                      :text-color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
                      class="text-caption"
                      style="font-family: monospace"
                      >PouchDB</q-badge
                    >
                  </q-btn>
                </div>
              </q-card>
            </div>

            <!-- Right Column (Work space: Form Engine / Conflict Resolver / Local Submissions List) -->
            <div class="col-12 col-md-8 col-lg-9 animate-fade-in">
              <!-- Conflict Resolver -->
              <q-card bordered v-if="conflictDoc" class="q-pa-md shadow-2">
                <div class="row items-center justify-between q-mb-sm">
                  <h3 class="text-subtitle1 text-bold q-my-none row items-center">
                    <q-icon
                      name="warning"
                      color="warning"
                      size="20px"
                      class="q-mr-xs animate-pulse"
                    />
                    {{ $t('conflict_resolver_title') }}
                  </h3>
                  <q-btn flat round dense icon="close" @click="conflictDoc = null" />
                </div>
                <q-separator class="q-mb-md" />

                <ConflictResolver
                  :conflictDoc="conflictDoc"
                  :template="templates.find((t) => t._id === conflictDoc!.template_id)!"
                  @resolved="onConflictResolved"
                  @cancel="conflictDoc = null"
                />
              </q-card>

              <!-- Form Engine -->
              <q-card bordered v-else-if="activeTemplate" class="q-pa-md">
                <FormEngine
                  :template="activeTemplate"
                  :initialData="editingSubmission?.data"
                  @save="handleSaveForm"
                  @cancel="cancelFormEdit"
                />
              </q-card>

              <!-- Local Submissions List -->
              <q-card bordered v-else class="q-pa-md">
                <div class="q-pb-md q-mb-sm text-left">
                  <h2 class="text-subtitle1 text-bold q-my-none row items-center">
                    <q-icon name="list_alt" color="blue" size="20px" class="q-mr-xs" />
                    {{ $t('local_registrations') }}
                  </h2>
                  <p class="text-caption text-grey-5 q-my-none">
                    {{ $t('local_registrations_desc') }}
                  </p>
                </div>
                <q-separator class="q-mb-md" />

                <!-- Empty state -->
                <div v-if="submissions.length === 0" class="text-center q-py-xl">
                  <q-icon name="storage" color="grey-8" size="3em" class="q-mb-md" />
                  <p class="text-subtitle2 text-grey-5 text-bold q-my-none">
                    {{ $t('no_local_entries') }}
                  </p>
                  <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                    {{ $t('no_local_entries_desc') }}
                  </p>
                </div>

                <!-- Submissions List -->
                <div v-else class="q-gutter-y-sm">
                  <q-card
                    v-for="sub in submissions"
                    :key="sub._id"
                    bordered
                    class="column q-mb-sm overflow-hidden"
                    :class="
                      hasConflicts(sub)
                        ? 'border-warning shadow-2'
                        : $q.dark.isActive
                          ? 'bg-black border-grey-9'
                          : 'bg-white border-grey-3'
                    "
                  >
                    <!-- Card Header -->
                    <div
                      class="row items-center justify-between q-px-md q-py-sm"
                      :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-2'"
                    >
                      <div class="row items-center gap-2">
                        <q-icon name="assignment" color="primary" size="18px" />
                        <span class="text-caption text-bold text-primary">
                          {{
                            templates.find((t) => t._id === sub.template_id)?.title ||
                            sub.template_id
                          }}
                        </span>
                        <span class="text-caption text-grey-5" style="font-family: monospace">
                          ({{ sub._id.split(':').pop()?.substring(0, 8) }}...)
                        </span>
                      </div>
                      <div class="row items-center gap-2">
                        <span class="text-caption text-grey-6" style="font-family: monospace">
                          {{ formatDate(sub.metadata.created_at) }}
                        </span>
                        <q-badge
                          v-if="hasConflicts(sub)"
                          color="warning"
                          text-color="black"
                          class="text-weight-bold text-caption row items-center q-ml-sm"
                        >
                          <q-icon name="warning" size="10px" class="q-mr-xs" />
                          {{ $t('revision_conflict') }}
                        </q-badge>
                      </div>
                    </div>

                    <!-- Card Body: Grid of properties -->
                    <q-card-section class="q-pa-md">
                      <div class="row q-col-gutter-sm">
                        <div
                          v-for="[key, val] in Object.entries(sub.data)"
                          :key="key"
                          class="col-12 col-sm-6 text-left"
                        >
                          <div class="row items-baseline justify-between q-py-xs">
                            <span class="text-caption text-bold text-grey-6"
                              >{{ formatFieldName(key) }}:</span
                            >
                            <span>
                              <template v-if="key === 'shelter_condition'">
                                <q-badge
                                  :color="getShelterConditionColor(val)"
                                  class="text-weight-bold q-px-sm"
                                >
                                  {{ getStatusLabel(val) }}
                                </q-badge>
                              </template>
                              <template v-else-if="typeof val === 'boolean'">
                                <q-badge
                                  :color="val ? 'indigo-5' : 'grey-7'"
                                  class="text-weight-bold q-px-sm"
                                >
                                  {{ val ? $t('yes') : $t('no') }}
                                </q-badge>
                              </template>
                              <template v-else>
                                <span
                                  class="text-caption font-medium"
                                  :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-9'"
                                >
                                  {{ String(val) }}
                                </span>
                              </template>
                            </span>
                          </div>
                        </div>
                      </div>
                    </q-card-section>

                    <!-- Card Actions Footer -->
                    <q-card-actions align="right" class="q-px-md q-py-sm bg-transparent">
                      <q-btn
                        v-if="hasConflicts(sub)"
                        color="warning"
                        text-color="black"
                        class="text-weight-bold q-px-md"
                        dense
                        no-caps
                        icon="warning"
                        :label="$t('resolve_conflict')"
                        @click="conflictDoc = sub"
                      />
                      <q-btn
                        v-else
                        outline
                        :color="$q.dark.isActive ? 'grey-5' : 'grey-8'"
                        class="text-weight-bold q-px-md"
                        dense
                        no-caps
                        icon="edit"
                        :label="$t('edit')"
                        @click="editSubmission(sub)"
                      />
                    </q-card-actions>
                  </q-card>
                </div>
              </q-card>
            </div>
          </template>
        </div>
      </main>

      <!-- Footer -->
      <footer
        class="q-py-sm text-center text-caption text-grey-6"
        :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-3'"
        style="font-family: monospace"
      >
        {{ $t('footer') }}
      </footer>
    </div>

    <!-- Infrastructure Simulator Modal Dialog -->
    <q-dialog v-model="showSimulatorModal" position="bottom">
      <q-card style="width: 900px; max-width: 95vw" :dark="$q.dark.isActive" class="q-pa-sm">
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="row items-center text-subtitle1 text-bold text-warning">
            <q-icon name="tune" class="q-mr-xs" size="20px" />
            {{ $t('sim_title') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <SimulatorPanel
            :isOnline="isOnline"
            :syncStatus="syncStatus"
            :syncError="syncError"
            :surveyorId="user?.id || ''"
            @toggleNetwork="handleToggleNetwork"
            @refresh="loadLocalData"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import axios from 'axios';
import CryptoJS from 'crypto-js';

import { useDatabase } from '../composables/useDatabase';
import type { SubmissionDoc, TemplateDoc } from '../composables/useDatabase';
import FormEngine from '../components/FormEngine.vue';
import ConflictResolver from '../components/ConflictResolver.vue';
import SimulatorPanel from '../components/SimulatorPanel.vue';
import AdminDashboard from '../components/AdminDashboard.vue';

const $q = useQuasar();
const isDark = ref(localStorage.getItem('theme') !== 'light');
$q.dark.set(isDark.value);

const showSimulatorModal = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  $q.dark.set(isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const i18n = useI18n();
const { locale } = i18n;

// Setup local db names
const LOCAL_DB_NAME = 'humanitysync';

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

// Update document root HTML dir attribute automatically for RTL support
watch(currentDir, (dir) => {
  document.documentElement.setAttribute('dir', dir);
});

// Authentication & Session
const token = ref<string | null>(localStorage.getItem('token'));
const user = ref<{ id: string; name: string; role: string } | null>(null);
const usernameInput = ref('surveyor1');
const passwordInput = ref('password');
const authError = ref<string | null>(null);
const authLoading = ref(false);

// Demo logins feature flag (configurable via QCLI_ENABLE_DEMO_LOGINS env var)
const enableDemoLogins = ref(
  process.env.QCLI_ENABLE_DEMO_LOGINS !== undefined
    ? process.env.QCLI_ENABLE_DEMO_LOGINS === 'true'
    : true,
);

function fillDemoCredentials(username: string, pass: string) {
  usernameInput.value = username;
  passwordInput.value = pass;
}

// Database Composable State
const {
  initDb,
  clearDbState,
  dbWrapper,
  syncStatus,
  syncError,
  submissions,
  templates,
  fetchSubmissions,
  fetchTemplates,
  putSubmission,
  setupSync,
  stopSync,
} = useDatabase();

// Local active elements
const activeTemplate = ref<TemplateDoc | null>(null);
const editingSubmission = ref<SubmissionDoc | null>(null);
const conflictDoc = ref<SubmissionDoc | null>(null);

// Navigation View
const view = ref<'field' | 'admin'>('field');

// Load user profile on launch if token is stored
onMounted(() => {
  document.documentElement.setAttribute('dir', currentDir.value);
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    void fetchUserProfile();
  }
});

const fetchUserProfile = async () => {
  try {
    const res = await axios.get<{ user: { id: string; name: string; role: string } }>(
      '/api/auth/me',
    );
    user.value = res.data.user;

    // Auto-setup database (salt key seed)
    initializeDbConnection(res.data.user.id, 'password', res.data.user.role);
  } catch (err) {
    console.error('Failed to load user profile:', err);
    handleLogout();
  }
};

const handleLogin = async () => {
  authLoading.value = true;
  authError.value = null;

  try {
    const res = await axios.post<{
      token: string;
      user: { id: string; name: string; role: string };
    }>('/api/auth/login', {
      username: usernameInput.value,
      password: passwordInput.value,
    });

    const { token: userToken, user: userData } = res.data;
    localStorage.setItem('token', userToken);
    token.value = userToken;
    user.value = userData;

    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

    // Derive DB encryption key securely
    const derivedKey = CryptoJS.SHA256(passwordInput.value).toString();
    initializeDbConnection(userData.id, derivedKey, userData.role);
  } catch (err: unknown) {
    console.error(err);
    let msg = t('login_failed');
    if (axios.isAxiosError(err) && err.response?.data?.error) {
      msg = String(err.response.data.error);
    }
    authError.value = msg;
  } finally {
    authLoading.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  token.value = null;
  user.value = null;
  clearDbState();
  activeTemplate.value = null;
  editingSubmission.value = null;
  conflictDoc.value = null;
  view.value = 'field';
  delete axios.defaults.headers.common['Authorization'];
};

// Connections
const isOnline = ref(true);

const initializeDbConnection = (userId: string, key: string, role?: string) => {
  initDb(LOCAL_DB_NAME, key);
  void loadLocalData();

  if (isOnline.value) {
    const remoteUrl = `${window.location.origin}/db/humanitysync`;
    setupSync(remoteUrl, userId, role);
  }
};

const loadLocalData = async () => {
  await fetchTemplates();
  await fetchSubmissions();
};

const handleToggleNetwork = (online: boolean) => {
  isOnline.value = online;
  if (!dbWrapper.value || !user.value) return;

  if (online) {
    const remoteUrl = `${window.location.origin}/db/humanitysync`;
    setupSync(remoteUrl, user.value.id, user.value.role);
  } else {
    stopSync();
    syncStatus.value = 'paused';
  }
};

// Form Engine Handlers
const selectTemplate = (tmpl: TemplateDoc) => {
  activeTemplate.value = tmpl;
  editingSubmission.value = null;
  conflictDoc.value = null;
};

const editSubmission = (sub: SubmissionDoc) => {
  editingSubmission.value = sub;
  const tmpl = templates.value.find((t) => t._id === sub.template_id);
  activeTemplate.value = tmpl || null;
};

const cancelFormEdit = () => {
  activeTemplate.value = null;
  editingSubmission.value = null;
};

const handleSaveForm = async (data: Record<string, unknown>) => {
  if (!dbWrapper.value || !user.value || (!activeTemplate.value && !editingSubmission.value))
    return;

  const templateId = activeTemplate.value
    ? activeTemplate.value._id
    : editingSubmission.value!.template_id;
  const deviceId = 'tablet_field_' + user.value.name.toLowerCase().replace(/\s/g, '_');

  let newDoc: SubmissionDoc;

  if (editingSubmission.value) {
    // Edit existing submission
    newDoc = {
      ...editingSubmission.value,
      data,
      sync_state: {
        synced: false,
        device_id: deviceId,
        last_attempt: new Date().toISOString(),
      },
      metadata: {
        ...editingSubmission.value.metadata,
        updated_at: new Date().toISOString(),
      },
    };
  } else {
    // Create new submission
    const submissionId = `submission:${templateId}:${CryptoJS.lib.WordArray.random(16).toString()}`;
    newDoc = {
      _id: submissionId,
      type: 'submission',
      template_id: templateId,
      status: 'completed',
      sync_state: {
        synced: false,
        device_id: deviceId,
      },
      metadata: {
        surveyor_id: user.value.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      data,
    };
  }

  try {
    await putSubmission(newDoc);
    activeTemplate.value = null;
    editingSubmission.value = null;
    await loadLocalData();
  } catch (err) {
    console.error('Failed to save submission:', err);
  }
};

const handleManualSyncTrigger = () => {
  if (!isOnline.value) {
    $q.notify({
      type: 'warning',
      message: t('quick_sync_offline_alert'),
    });
    return;
  }
  if (user.value) {
    const remoteUrl = `${window.location.origin}/db/humanitysync`;
    setupSync(remoteUrl, user.value.id, user.value.role);
  }
};

// Conflict Handlers
const hasConflicts = (sub: SubmissionDoc) => {
  return sub._conflicts && sub._conflicts.length > 0;
};

const onConflictResolved = () => {
  conflictDoc.value = null;
  void loadLocalData();
};

// Admin handlers
const adminSubmissions = ref<SubmissionDoc[]>([]);
const handleOpenAdmin = async () => {
  view.value = 'admin';
  try {
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

const setLanguage = (code: string) => {
  locale.value = code;
};

const formatFieldName = (name: string) => {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getShelterConditionColor = (val: unknown) => {
  if (val === 'critical') return 'red';
  if (val === 'damaged') return 'warning';
  return 'green';
};

const getStatusLabel = (condition: unknown) => {
  if (condition === 'critical') return t('cond_critical');
  if (condition === 'damaged') return t('cond_damaged');
  return t('cond_normal');
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString(locale.value);
};

// Local translation shortcut helper
const t = (key: string) => {
  const translationsMap = i18n.messages.value[locale.value] as Record<string, string>;
  return translationsMap ? translationsMap[key] || key : key;
};
</script>
