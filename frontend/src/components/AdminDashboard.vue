<template>
  <div class="q-gutter-y-md">
    <!-- Header -->
    <div
      class="row items-center justify-between q-pa-md rounded-borders border q-mb-md"
      :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-2'"
      :style="{ borderColor: $q.dark.isActive ? '#1e293b' : '#cbd5e1' }"
    >
      <div class="row items-center gap-3">
        <q-btn
          flat
          dense
          :color="$q.dark.isActive ? 'grey-4' : 'grey-8'"
          :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
          class="q-pa-sm rounded-borders"
          icon="arrow_back"
          @click="$emit('back')"
        />
        <div class="text-left">
          <h2 class="text-h6 text-bold q-my-none row items-center">
            <q-icon name="settings" color="indigo-5" size="24px" class="q-mr-xs" />
            {{ $t('project_dashboard') }}
          </h2>
          <p class="text-caption text-grey-5 q-my-none">{{ $t('dashboard_desc') }}</p>
        </div>
      </div>

      <q-tabs
        v-model="activeTab"
        dense
        :active-color="$q.dark.isActive ? 'white' : 'primary'"
        :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-7'"
        indicator-color="indigo-5"
        align="left"
        narrow-indicator
        :dark="$q.dark.isActive"
      >
        <q-tab name="submissions" icon="database" :label="$t('synced_data')" no-caps />
        <q-tab name="map" icon="map" :label="$t('map_overview')" no-caps />
        <q-tab name="builder" icon="add" :label="$t('form_designer')" no-caps />
      </q-tabs>
    </div>

    <!-- Submissions Panel -->
    <div v-if="activeTab === 'submissions'" class="q-gutter-y-md">
      <!-- Universal Platform Metrics -->
      <div class="row q-col-gutter-md">
        <!-- Total Records -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card bordered class="text-left shadow-1">
            <q-card-section class="row items-center justify-between">
              <div>
                <span
                  class="text-caption uppercase text-grey-6 text-bold"
                  style="letter-spacing: 0.05em"
                  >{{ $t('metric_records') }}</span
                >
                <span class="text-h5 text-bold q-mt-xs" style="display: block">{{
                  totalSubmissions
                }}</span>
              </div>
              <q-icon name="database" color="blue" size="28px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Form Templates -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card bordered class="text-left shadow-1">
            <q-card-section class="row items-center justify-between">
              <div>
                <span
                  class="text-caption uppercase text-grey-6 text-bold"
                  style="letter-spacing: 0.05em"
                  >{{ $t('metric_templates') }}</span
                >
                <span class="text-h5 text-bold text-indigo q-mt-xs" style="display: block">{{
                  totalTemplates
                }}</span>
              </div>
              <q-icon name="assignment" color="indigo" size="28px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Revision Conflicts -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card
            bordered
            class="text-left shadow-1"
            :style="{ borderColor: pendingConflictsCount > 0 ? 'rgba(239, 68, 68, 0.5)' : '' }"
          >
            <q-card-section class="row items-center justify-between">
              <div>
                <span
                  class="text-caption uppercase text-grey-6 text-bold"
                  style="letter-spacing: 0.05em"
                  >{{ $t('metric_conflicts') }}</span
                >
                <span
                  class="text-h5 text-bold q-mt-xs"
                  :class="pendingConflictsCount > 0 ? 'text-red' : 'text-positive'"
                  style="display: block"
                  >{{ pendingConflictsCount }}</span
                >
              </div>
              <q-icon
                name="sync_problem"
                :color="pendingConflictsCount > 0 ? 'red' : 'positive'"
                size="28px"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Field Workers -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-card bordered class="text-left shadow-1">
            <q-card-section class="row items-center justify-between">
              <div>
                <span
                  class="text-caption uppercase text-grey-6 text-bold"
                  style="letter-spacing: 0.05em"
                  >{{ $t('metric_surveyors') }}</span
                >
                <span class="text-h5 text-bold text-teal q-mt-xs" style="display: block">{{
                  uniqueSurveyorsCount
                }}</span>
              </div>
              <q-icon name="people" color="teal" size="28px" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Form Filter & Dynamic Schema Analytics Section -->
      <q-card bordered class="q-pa-md shadow-1">
        <div class="row items-center justify-between q-mb-xs" style="gap: 12px">
          <div class="row items-center gap-2">
            <q-icon name="tune" color="indigo-5" size="22px" />
            <h3 class="text-subtitle1 text-bold q-my-none">{{ $t('filter_form_template') }}</h3>
          </div>
          <div style="min-width: 240px; max-width: 360px" class="col-12 col-sm-auto">
            <q-select
              v-model="selectedFormFilter"
              :options="formFilterOptions"
              emit-value
              map-options
              dense
              outlined
              :dark="$q.dark.isActive"
              options-dense
            />
          </div>
        </div>

        <!-- Dynamic Field Analytics Section -->
        <div
          v-if="dynamicSelectStats.length > 0 || dynamicNumericStats.length > 0"
          class="q-mt-md"
        >
          <div
            class="text-caption text-grey-5 text-bold uppercase q-mb-xs"
            style="letter-spacing: 0.05em"
          >
            {{ $t('dynamic_field_analytics') }}
          </div>

          <div class="row q-col-gutter-md q-mt-xs">
            <!-- Dynamic Select Field Breakdown Cards -->
            <div
              v-for="stat in dynamicSelectStats"
              :key="stat.fieldId"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card
                bordered
                flat
                class="q-pa-sm"
                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-1'"
              >
                <div
                  class="text-caption text-bold text-indigo-4 row items-center justify-between"
                >
                  <span>{{ stat.fieldLabel }}</span>
                  <q-badge color="indigo" class="text-caption">Option Breakdown</q-badge>
                </div>
                <div class="q-mt-xs q-gutter-y-xs">
                  <div
                    v-for="opt in stat.options"
                    :key="opt.value"
                    class="row items-center justify-between text-caption"
                  >
                    <span class="text-grey-5">{{ opt.label }}:</span>
                    <span class="text-bold">
                      {{ opt.count }}
                      <span class="text-grey-6 text-weight-normal">({{ opt.percentage }}%)</span>
                    </span>
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Dynamic Numeric Field Stat Cards -->
            <div
              v-for="nStat in dynamicNumericStats"
              :key="nStat.fieldId"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card
                bordered
                flat
                class="q-pa-sm"
                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-1'"
              >
                <div
                  class="text-caption text-bold text-purple-4 row items-center justify-between"
                >
                  <span>{{ nStat.fieldLabel }}</span>
                  <q-badge color="purple" class="text-caption">Numeric Metrics</q-badge>
                </div>
                <div class="q-mt-xs row justify-between text-caption">
                  <div>
                    <span class="text-grey-5 block">Average:</span>
                    <span class="text-h6 text-bold text-purple-3">{{ nStat.average }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-grey-5 block">Total (Min-Max):</span>
                    <span class="text-caption text-bold"
                      >{{ nStat.total }}
                      <span class="text-grey-5">({{ nStat.min }}-{{ nStat.max }})</span></span
                    >
                  </div>
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Submissions Table Card -->
      <q-card bordered class="overflow-hidden">
        <div
          class="row justify-between items-center q-pa-md"
          :class="$q.dark.isActive ? 'bg-black' : 'bg-grey-2'"
          style="gap: 8px"
        >
          <h3 class="text-subtitle2 text-bold q-my-none row items-center">
            <q-icon name="assignment" color="indigo-5" size="18px" class="q-mr-xs" />
            {{ $t('db_entries') }}
          </h3>
          <span class="text-caption text-grey-5" style="font-family: monospace">{{
            $t('connection_info')
          }}</span>
        </div>
        <q-separator />

        <div v-if="filteredSubmissions.length === 0" class="text-center q-py-xl">
          <q-icon name="cloud_off" color="grey-7" size="3em" class="q-mb-sm" />
          <p class="text-grey-5 text-caption">{{ $t('no_synced_data') }}</p>
        </div>

        <q-table
          v-else
          flat
          :dark="$q.dark.isActive"
          style="background-color: transparent"
          :rows="filteredSubmissions"
          :columns="columns"
          row-key="_id"
        >
          <!-- Custom ID/Time Column -->
          <template v-slot:body-cell-id_time="props">
            <q-td :props="props" class="cursor-pointer">
              <span class="block text-caption text-weight-bold" style="font-family: monospace">
                {{ props.row._id.split(':').pop()?.substring(0, 12) }}...
              </span>
              <span class="text-caption text-grey-5 block">
                {{ formatDate(props.row.metadata.created_at) }}
              </span>
              <q-tooltip
                class="bg-indigo-10 text-white q-pa-sm shadow-3 text-caption"
                anchor="top middle"
                self="bottom middle"
              >
                <div class="text-weight-bold" style="font-family: monospace">
                  ID: {{ props.row._id }}
                </div>
                <div>Created: {{ formatDate(props.row.metadata.created_at) }}</div>
                <div v-if="props.row.metadata.updated_at">
                  Updated: {{ formatDate(props.row.metadata.updated_at) }}
                </div>
              </q-tooltip>
            </q-td>
          </template>

          <!-- Custom Surveyor Column -->
          <template v-slot:body-cell-surveyor="props">
            <q-td :props="props" class="cursor-pointer">
              <span class="text-caption text-grey-5">{{ props.row.metadata.surveyor_id }}</span>
              <q-tooltip
                class="bg-grey-9 text-caption q-pa-xs"
                anchor="top middle"
                self="bottom middle"
              >
                Surveyor ID: {{ props.row.metadata.surveyor_id }}
              </q-tooltip>
            </q-td>
          </template>

          <!-- Custom Data JSON Column -->
          <template v-slot:body-cell-data="props">
            <q-td :props="props" style="max-width: 360px; white-space: normal">
              <div
                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-2'"
                class="q-pa-xs rounded-borders overflow-auto border cursor-pointer relative-position"
                style="max-height: 110px; max-width: 350px; opacity: 0.95"
                @click="selectedJsonDoc = props.row"
              >
                <pre
                  class="q-my-none text-caption text-weight-bold"
                  :class="$q.dark.isActive ? 'text-indigo-3' : 'text-indigo-9'"
                  style="
                    font-family: monospace;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-size: 0.72rem;
                    line-height: 1.25;
                  "
                  >{{ formatJsonData(props.row.data) }}</pre
                >
              </div>
              <q-tooltip
                class="bg-grey-10 text-white border q-pa-sm shadow-4"
                max-width="500px"
                anchor="top middle"
                self="bottom middle"
              >
                <div class="text-caption text-weight-bold q-mb-xs text-indigo-3">
                  Klicken für vollständiges JSON:
                </div>
                <pre
                  style="
                    font-family: monospace;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-size: 0.75rem;
                    margin: 0;
                  "
                  >{{ formatJsonData(props.row.data) }}</pre
                >
              </q-tooltip>
            </q-td>
          </template>

          <!-- Custom Status Column -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="getStatusBadgeColor(props.row.data?.shelter_condition)"
                class="text-weight-bold q-px-sm q-py-xs"
              >
                {{ getStatusLabel(props.row.data?.shelter_condition) }}
              </q-badge>
            </q-td>
          </template>

          <!-- Custom Conflicts Column -->
          <template v-slot:body-cell-conflicts="props">
            <q-td :props="props" class="text-center">
              <q-badge
                v-if="props.row._conflicts && props.row._conflicts.length > 0"
                color="warning"
                text-color="black"
                class="text-weight-bold q-px-sm q-py-xs cursor-pointer"
                @click="conflictDoc = props.row"
              >
                <q-icon name="warning" size="12px" class="q-mr-xs" />
                {{ props.row._conflicts.length }}
              </q-badge>
              <span v-else class="text-caption text-grey-6">-</span>
            </q-td>
          </template>

          <!-- Custom Actions Column -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="code"
                @click="selectedJsonDoc = props.row"
              >
                <q-tooltip>{{ $t('view_details') || 'JSON Details' }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Form Builder Panel -->
    <div v-if="activeTab === 'builder'" class="row q-col-gutter-lg text-left">
      <!-- Options Left Panel -->
      <div class="col-12 col-lg-5">
        <q-card bordered class="q-pa-md q-gutter-y-md">
          <h3 class="text-subtitle2 text-bold q-my-none">{{ $t('add_field') }}</h3>
          <q-separator class="q-mb-sm" />

          <!-- Field Name Label -->
          <div>
            <label class="block text-caption text-grey-5 q-mb-xs">{{ $t('field_label') }}</label>
            <q-input
              v-model="fieldLabel"
              outlined
              dense
              :dark="$q.dark.isActive"
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="Field name..."
            />
          </div>

          <!-- Field Type Select -->
          <div>
            <label class="block text-caption text-grey-5 q-mb-xs">{{ $t('field_type') }}</label>
            <q-select
              v-model="fieldType"
              outlined
              dense
              :dark="$q.dark.isActive"
              emit-value
              map-options
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              :options="[
                { label: $t('type_text'), value: 'text' },
                { label: $t('type_textarea'), value: 'textarea' },
                { label: $t('type_number'), value: 'number' },
                { label: $t('type_boolean'), value: 'boolean' },
                { label: $t('type_select'), value: 'select' },
                { label: $t('type_multiselect'), value: 'multiselect' },
                { label: $t('type_date'), value: 'date' },
                { label: $t('type_location'), value: 'location' },
                { label: $t('type_image'), value: 'image' },
                { label: $t('type_section'), value: 'section' },
              ]"
            />
          </div>

          <!-- Placeholder Input -->
          <div v-if="['text', 'textarea', 'number', 'select'].includes(fieldType)">
            <label class="block text-caption text-grey-5 q-mb-xs">{{
              $t('field_placeholder')
            }}</label>
            <q-input
              v-model="fieldPlaceholder"
              outlined
              dense
              :dark="$q.dark.isActive"
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="e.g. Enter full name..."
            />
          </div>

          <!-- Hint / Description Input -->
          <div>
            <label class="block text-caption text-grey-5 q-mb-xs">{{ $t('field_hint') }}</label>
            <q-input
              v-model="fieldHint"
              outlined
              dense
              :dark="$q.dark.isActive"
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="Help text for surveyors..."
            />
          </div>

          <!-- Section Icon Input (if section type) -->
          <div v-if="fieldType === 'section'">
            <label class="block text-caption text-grey-5 q-mb-xs">{{
              $t('field_section_icon')
            }}</label>
            <q-input
              v-model="fieldSectionIcon"
              outlined
              dense
              :dark="$q.dark.isActive"
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="bookmark, info, place, photo, person"
            />
          </div>

          <!-- Dropdown / Multiselect Options -->
          <div v-if="['select', 'multiselect'].includes(fieldType)">
            <label class="block text-caption text-grey-5 q-mb-xs">{{
              $t('dropdown_options')
            }}</label>
            <q-input
              v-model="fieldOptionsText"
              outlined
              dense
              :dark="$q.dark.isActive"
              color="indigo-5"
              :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>

          <!-- Required Field Toggle -->
          <div v-if="fieldType !== 'section'" class="row items-center q-py-xs">
            <q-toggle
              v-model="fieldRequired"
              color="indigo-5"
              :dark="$q.dark.isActive"
              :label="$t('mark_required')"
            />
          </div>

          <!-- Add Button -->
          <q-btn
            :color="$q.dark.isActive ? 'grey-9' : 'grey-3'"
            :text-color="$q.dark.isActive ? 'white' : 'grey-9'"
            class="full-width text-weight-bold"
            no-caps
            icon="add"
            @click="handleAddField"
          >
            {{ $t('btn_add_field') }}
          </q-btn>
        </q-card>
      </div>

      <!-- Preview & Order Right Panel -->
      <div class="col-12 col-lg-7">
        <q-card bordered class="q-pa-md column full-height">
          <div class="row items-center justify-between q-mb-sm">
            <h3 class="text-subtitle2 text-bold q-my-none">
              {{ $t('preview_publish') }}
            </h3>
            <q-btn-toggle
              v-model="builderRightTab"
              dense
              no-caps
              size="sm"
              toggle-color="indigo-5"
              :options="[
                { label: $t('form_fields'), value: 'fields' },
                { label: $t('live_preview'), value: 'preview' },
              ]"
            />
          </div>
          <q-separator class="q-mb-md" />

          <q-banner
            v-if="builderError"
            rounded
            class="q-mb-md text-caption"
            :class="$q.dark.isActive ? 'bg-red-10 text-red-3' : 'bg-red-1 text-red-9'"
          >
            <template v-slot:avatar><q-icon name="error" color="negative" /></template>
            {{ builderError }}
          </q-banner>

          <q-form @submit="handleSaveTemplate" class="column q-gutter-y-md justify-between col">
            <div class="q-gutter-y-md">
              <!-- Form Title input -->
              <div>
                <label class="block text-caption text-grey-5 q-mb-xs">{{ $t('form_title') }}</label>
                <q-input
                  v-model="newTitle"
                  outlined
                  dense
                  :dark="$q.dark.isActive"
                  required
                  color="indigo-5"
                  :bg-color="$q.dark.isActive ? 'black' : 'grey-2'"
                  placeholder="New Form Title..."
                />
              </div>

              <!-- View 1: Fields Ordering List -->
              <div
                v-if="builderRightTab === 'fields'"
                :class="$q.dark.isActive ? 'bg-black' : 'bg-grey-2'"
                class="q-pa-md rounded-borders overflow-y-auto q-gutter-y-sm"
                style="min-height: 220px; max-height: 360px"
              >
                <div
                  class="text-caption text-grey-6 text-bold uppercase q-mb-sm"
                  style="letter-spacing: 0.05em; font-family: monospace"
                >
                  {{ $t('form_fields') }} ({{ fields.length }})
                </div>

                <div
                  v-if="fields.length === 0"
                  class="column items-center justify-center q-py-xl text-grey-6 text-caption"
                >
                  {{ $t('fields_preview_empty') }}
                </div>

                <div
                  v-else
                  v-for="(f, idx) in fields"
                  :key="f.id + '_' + idx"
                  :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-white'"
                  class="row items-center justify-between q-pa-sm rounded-borders border"
                >
                  <div class="text-left col">
                    <div class="row items-center gap-1">
                      <q-icon
                        :name="f.type === 'section' ? f.section_icon || 'bookmark' : 'description'"
                        color="indigo-5"
                        size="16px"
                      />
                      <span class="text-caption text-weight-bold">
                        {{ f.label }}
                        <span v-if="f.required" class="text-red">*</span>
                      </span>
                    </div>
                    <span class="text-caption text-grey-6 block q-mt-xs">
                      Type: <strong>{{ $t('type_' + f.type) }}</strong>
                      <template v-if="f.options"> ({{ f.options.length }} options)</template>
                      <template v-if="f.hint">
                        • <em>{{ f.hint }}</em></template
                      >
                    </span>
                  </div>

                  <div class="row items-center q-gutter-x-xs">
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="arrow_upward"
                      :disabled="idx === 0"
                      @click="handleMoveUp(idx)"
                    />
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="arrow_downward"
                      :disabled="idx === fields.length - 1"
                      @click="handleMoveDown(idx)"
                    />
                    <q-btn
                      flat
                      dense
                      round
                      color="red"
                      icon="delete"
                      size="sm"
                      @click="handleRemoveField(idx)"
                    />
                  </div>
                </div>
              </div>

              <!-- View 2: Live Interactive Form Engine Preview -->
              <div
                v-else
                :class="$q.dark.isActive ? 'bg-black' : 'bg-grey-1'"
                class="q-pa-md rounded-borders overflow-y-auto border"
                style="min-height: 220px; max-height: 360px"
              >
                <FormEngine :template="previewTemplate" @save="() => {}" @cancel="() => {}" />
              </div>
            </div>

            <!-- Action Footer -->
            <div class="row justify-end q-pt-md">
              <q-btn
                type="submit"
                color="primary"
                class="text-weight-bold text-white q-px-md"
                no-caps
                icon="save"
                :loading="loading"
              >
                {{ $t('btn_publish_template') }}
              </q-btn>
            </div>
          </q-form>
        </q-card>
      </div>
    </div>
  </div>

  <!-- Conflict Resolver Dialog -->
  <q-dialog v-model="conflictDialogOpened" persistent max-width="800px" width="100%">
    <q-card style="min-width: 350px; max-width: 800px" :dark="$q.dark.isActive">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-bold">{{ $t('revision_conflict') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <ConflictResolver
          v-if="conflictDoc && getTemplateForDoc(conflictDoc)"
          :conflictDoc="conflictDoc"
          :template="getTemplateForDoc(conflictDoc)!"
          @resolved="handleConflictResolved"
          @cancel="conflictDoc = null"
        />
        <div v-else class="text-center q-py-lg">
          {{ $t('templates_loading') }}
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- JSON Viewer Dialog -->
  <q-dialog v-model="jsonDialogOpened">
    <q-card style="width: 700px; max-width: 95vw" :dark="$q.dark.isActive">
      <q-card-section class="row items-center justify-between q-pb-xs">
        <div class="text-h6 text-bold row items-center">
          <q-icon name="code" color="primary" size="24px" class="q-mr-sm" />
          JSON Details ({{ selectedJsonDoc?._id }})
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Map Preview in Modal if Geodata exists -->
        <div v-if="getDocLocation(selectedJsonDoc)" class="q-mb-md">
          <div class="text-caption text-weight-bold text-grey-6 q-mb-xs row items-center">
            <q-icon name="place" color="primary" class="q-mr-xs" />
            Erfasster GPS-Standort:
          </div>
          <MapView :singleLocation="getDocLocation(selectedJsonDoc)" height="220px" />
        </div>

        <div
          :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-2'"
          class="q-pa-md rounded-borders overflow-auto"
          style="max-height: 350px; border: 1px solid rgba(128, 128, 128, 0.3)"
        >
          <pre
            style="
              font-family: monospace;
              font-size: 0.85rem;
              white-space: pre-wrap;
              word-break: break-all;
              margin: 0;
            "
            >{{ JSON.stringify(selectedJsonDoc, null, 2) }}</pre
          >
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          color="primary"
          icon="content_copy"
          label="Copy JSON"
          no-caps
          @click="copyJsonToClipboard"
        />
        <q-btn flat label="Close" no-caps v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { copyToClipboard, useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import axios from 'axios';
import type { FormField, SubmissionDoc, TemplateDoc } from '../composables/useDatabase';
import ConflictResolver from './ConflictResolver.vue';
import FormEngine from './FormEngine.vue';
import MapView from './MapView.vue';

const props = defineProps<{
  submissions: SubmissionDoc[];
  templates: TemplateDoc[];
  token: string;
}>();

const emit = defineEmits<{
  (e: 'templateCreated'): void;
  (e: 'refreshSubmissions'): void;
  (e: 'back'): void;
}>();

const $q = useQuasar();
const { t, locale } = useI18n();

const activeTab = ref<'submissions' | 'map' | 'builder'>('submissions');
const builderRightTab = ref<'fields' | 'preview'>('fields');

// Conflict resolution dialog state
const conflictDoc = ref<SubmissionDoc | null>(null);
const conflictDialogOpened = computed({
  get: () => conflictDoc.value !== null,
  set: (val) => {
    if (!val) {
      conflictDoc.value = null;
    }
  },
});

// JSON Viewer Dialog state
const selectedJsonDoc = ref<SubmissionDoc | null>(null);
const jsonDialogOpened = computed({
  get: () => selectedJsonDoc.value !== null,
  set: (val) => {
    if (!val) {
      selectedJsonDoc.value = null;
    }
  },
});

const copyJsonToClipboard = () => {
  if (selectedJsonDoc.value) {
    void copyToClipboard(JSON.stringify(selectedJsonDoc.value, null, 2)).then(() => {
      $q.notify({
        type: 'positive',
        message: 'JSON copied to clipboard',
        timeout: 2000,
      });
    });
  }
};

const getDocLocation = (
  doc: SubmissionDoc | null,
): { latitude: number; longitude: number; accuracy?: number | undefined } | null => {
  if (!doc || !doc.data) return null;
  if (doc.data.location && typeof doc.data.location === 'object') {
    const loc = doc.data.location as {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
      accuracy?: number;
    };
    const lat = loc.latitude ?? loc.lat;
    const lng = loc.longitude ?? loc.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { latitude: lat, longitude: lng, accuracy: loc.accuracy };
    }
  }
  if (typeof doc.data.latitude === 'number' && typeof doc.data.longitude === 'number') {
    return {
      latitude: Number(doc.data.latitude),
      longitude: Number(doc.data.longitude),
      accuracy: typeof doc.data.accuracy === 'number' ? doc.data.accuracy : undefined,
    };
  }
  return null;
};

const getTemplateForDoc = (doc: SubmissionDoc) => {
  return props.templates.find((tmpl) => tmpl._id === doc.template_id);
};

const handleConflictResolved = () => {
  conflictDoc.value = null;
  emit('refreshSubmissions');
};

// Form Builder state
const newTitle = ref('');
const fields = ref<FormField[]>([]);
const loading = ref(false);
const builderError = ref<string | null>(null);

// Field editing state
const fieldLabel = ref('');
const fieldType = ref<
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'location'
  | 'image'
  | 'section'
>('text');
const fieldRequired = ref(false);
const fieldPlaceholder = ref('');
const fieldHint = ref('');
const fieldSectionIcon = ref('bookmark');
const fieldOptionsText = ref('');

// Dynamic preview template for live testing
const previewTemplate = computed<TemplateDoc>(() => ({
  _id: 'template:preview',
  type: 'template',
  version: 1,
  title: newTitle.value || 'Form Title Preview',
  metadata: {
    created_at: new Date().toISOString(),
    author: 'admin',
    target_region: 'Preview',
  },
  fields: fields.value,
}));

// --- Form Template Filter & Dynamic Metrics Engine ---
const selectedFormFilter = ref<string>('all');

const formFilterOptions = computed(() => {
  const opts = [{ label: t('filter_all_templates') || 'All Form Schemas', value: 'all' }];
  props.templates.forEach((tmpl) => {
    opts.push({
      label: `${tmpl.title} (v${tmpl.version})`,
      value: tmpl._id,
    });
  });
  return opts;
});

// Universal Platform Metrics
const totalSubmissions = computed(() => props.submissions.length);
const totalTemplates = computed(() => props.templates.length);
const pendingConflictsCount = computed(() => {
  return props.submissions.filter((s) => s._conflicts && s._conflicts.length > 0).length;
});
const uniqueSurveyorsCount = computed(() => {
  const surveyors = new Set(props.submissions.map((s) => s.metadata?.surveyor_id).filter(Boolean));
  return surveyors.size;
});

// Filtered Submissions based on Form Selection
const filteredSubmissions = computed(() => {
  if (selectedFormFilter.value === 'all') return props.submissions;
  return props.submissions.filter((s) => s.template_id === selectedFormFilter.value);
});

// Dynamic Schema Analysis & Aggregations
interface DynamicSelectStat {
  fieldId: string;
  fieldLabel: string;
  options: Array<{ value: string; label: string; count: number; percentage: number }>;
}

interface DynamicNumericStat {
  fieldId: string;
  fieldLabel: string;
  average: string;
  total: number;
  min: number;
  max: number;
}

const activeFormTemplate = computed<TemplateDoc | null>(() => {
  if (selectedFormFilter.value === 'all') return null;
  return props.templates.find((t) => t._id === selectedFormFilter.value) || null;
});

const dynamicSelectStats = computed<DynamicSelectStat[]>(() => {
  const stats: DynamicSelectStat[] = [];
  const subs = filteredSubmissions.value;
  if (subs.length === 0) return stats;

  let selectFields: FormField[] = [];
  if (activeFormTemplate.value) {
    selectFields = activeFormTemplate.value.fields.filter(
      (f) => f.type === 'select' || f.type === 'multiselect',
    );
  } else {
    const seenFields = new Map<string, FormField>();
    props.templates.forEach((t) => {
      t.fields.forEach((f) => {
        if ((f.type === 'select' || f.type === 'multiselect') && !seenFields.has(f.id)) {
          seenFields.set(f.id, f);
        }
      });
    });
    selectFields = Array.from(seenFields.values());
  }

  selectFields.forEach((field) => {
    const countsMap: Record<string, number> = {};
    let filledCount = 0;

    subs.forEach((sub) => {
      const val = sub.data?.[field.id];
      if (val !== undefined && val !== null && val !== '') {
        const valStr =
          typeof val === 'string'
            ? val
            : typeof val === 'number' || typeof val === 'boolean'
              ? String(val)
              : JSON.stringify(val);
        countsMap[valStr] = (countsMap[valStr] || 0) + 1;
        filledCount++;
      }
    });

    if (filledCount > 0) {
      const options = Object.entries(countsMap).map(([optVal, count]) => {
        const matchingOpt = field.options?.find((o) => o.value === optVal);
        return {
          value: optVal,
          label: matchingOpt?.label || optVal,
          count,
          percentage: Math.round((count / filledCount) * 100),
        };
      });

      stats.push({
        fieldId: field.id,
        fieldLabel: field.label,
        options,
      });
    }
  });

  return stats;
});

const dynamicNumericStats = computed<DynamicNumericStat[]>(() => {
  const stats: DynamicNumericStat[] = [];
  const subs = filteredSubmissions.value;
  if (subs.length === 0) return stats;

  let numberFields: FormField[] = [];
  if (activeFormTemplate.value) {
    numberFields = activeFormTemplate.value.fields.filter((f) => f.type === 'number');
  } else {
    const seenFields = new Map<string, FormField>();
    props.templates.forEach((t) => {
      t.fields.forEach((f) => {
        if (f.type === 'number' && !seenFields.has(f.id)) {
          seenFields.set(f.id, f);
        }
      });
    });
    numberFields = Array.from(seenFields.values());
  }

  numberFields.forEach((field) => {
    let total = 0;
    let count = 0;
    let min = Infinity;
    let max = -Infinity;

    subs.forEach((sub) => {
      const rawVal = sub.data?.[field.id];
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        const num = Number(rawVal);
        if (!isNaN(num)) {
          total += num;
          count++;
          if (num < min) min = num;
          if (num > max) max = num;
        }
      }
    });

    if (count > 0) {
      stats.push({
        fieldId: field.id,
        fieldLabel: field.label,
        total,
        average: (total / count).toFixed(1),
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
      });
    }
  });

  return stats;
});

// Table columns
const columns: QTableColumn<SubmissionDoc>[] = [
  { name: 'id_time', align: 'left', label: t('table_id_time'), field: '_id', sortable: true },
  {
    name: 'surveyor',
    align: 'left',
    label: t('table_surveyor'),
    field: (row) => row.metadata.surveyor_id,
    sortable: true,
  },
  { name: 'data', align: 'left', label: t('table_data'), field: 'data' },
  {
    name: 'status',
    align: 'left',
    label: t('table_status'),
    field: (row) => row.data?.shelter_condition,
    sortable: true,
  },
  {
    name: 'conflicts',
    align: 'center',
    label: t('table_conflicts'),
    field: (row) => row._conflicts?.length || 0,
    sortable: true,
  },
  { name: 'actions', align: 'right', label: t('table_actions'), field: () => '' },
];

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString(locale.value);
};

const formatJsonData = (data: Record<string, unknown> | undefined) => {
  if (!data) return '{}';
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      const kb = Math.round(val.length / 1024);
      cleaned[key] = `[Photo Attachment: ~${kb}KB Base64]`;
    } else {
      cleaned[key] = val;
    }
  }
  return JSON.stringify(cleaned, null, 2);
};

const getStatusBadgeColor = (condition: unknown) => {
  if (condition === 'critical') return 'red';
  if (condition === 'damaged') return 'warning';
  return 'green';
};

const getStatusLabel = (condition: unknown) => {
  if (condition === 'critical') return t('cond_critical');
  if (condition === 'damaged') return t('cond_damaged');
  return t('cond_normal');
};

const handleAddField = () => {
  if (!fieldLabel.value.trim()) return;

  const id = fieldLabel.value.toLowerCase().replace(/[^a-z0-9]/g, '_');

  let options: { value: string; label: string }[] | undefined = undefined;
  if (
    (fieldType.value === 'select' || fieldType.value === 'multiselect') &&
    fieldOptionsText.value.trim()
  ) {
    options = fieldOptionsText.value.split(',').map((opt) => {
      const clean = opt.trim();
      return {
        value: clean.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: clean,
      };
    });
  }

  const newField: FormField = {
    id,
    type: fieldType.value,
    label: fieldLabel.value,
    required: fieldType.value !== 'section' ? fieldRequired.value : false,
  };

  if (fieldPlaceholder.value.trim()) {
    newField.placeholder = fieldPlaceholder.value.trim();
  }
  if (fieldHint.value.trim()) {
    newField.hint = fieldHint.value.trim();
  }
  if (fieldType.value === 'section' && fieldSectionIcon.value.trim()) {
    newField.section_icon = fieldSectionIcon.value.trim();
  }
  if (options) {
    newField.options = options;
  }

  fields.value.push(newField);

  // Reset field builder inputs
  fieldLabel.value = '';
  fieldRequired.value = false;
  fieldPlaceholder.value = '';
  fieldHint.value = '';
  fieldSectionIcon.value = 'bookmark';
  fieldOptionsText.value = '';
};

const handleMoveUp = (index: number) => {
  const curr = fields.value[index];
  const prev = fields.value[index - 1];
  if (index <= 0 || !curr || !prev) return;
  fields.value[index] = prev;
  fields.value[index - 1] = curr;
};

const handleMoveDown = (index: number) => {
  const curr = fields.value[index];
  const next = fields.value[index + 1];
  if (index >= fields.value.length - 1 || !curr || !next) return;
  fields.value[index] = next;
  fields.value[index + 1] = curr;
};

const handleRemoveField = (index: number) => {
  fields.value = fields.value.filter((_, idx) => idx !== index);
};

const handleSaveTemplate = async () => {
  if (!newTitle.value.trim()) return;
  if (fields.value.length === 0) {
    builderError.value = t('builder_error_empty');
    return;
  }

  loading.value = true;
  builderError.value = null;

  const templateId = `template:${newTitle.value.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v1`;

  const newTemplate = {
    _id: templateId,
    title: newTitle.value,
    version: 1,
    fields: fields.value,
  };

  try {
    await axios.post('/api/admin/templates', newTemplate, {
      headers: { Authorization: `Bearer ${props.token}` },
    });

    emit('templateCreated');
    newTitle.value = '';
    fields.value = [];
    activeTab.value = 'submissions';
  } catch (err: unknown) {
    console.error(err);
    const msg =
      axios.isAxiosError(err) && err.response?.data?.error
        ? String(err.response.data.error)
        : t('builder_error_fail');
    builderError.value = msg;
  } finally {
    loading.value = false;
  }
};
</script>
