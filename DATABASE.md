# مستند پایگاه‌داده HopeNest Hub

## موجودیت‌ها و فیلدهای کلیدی
- **`roles`**
  - **کلیدها**: `id`
  - **فیلدها**: `name`, `description`

- **`users`**
  - **کلیدها**: `id`
  - **فیلدها**: `name`, `email` (unique), `phone`, `password_hash`, `date_of_birth`, `gender`, `role_id` (FK→`roles.id`), `status`, `is_verified`, `created_at`, `updated_at`

- **`patients`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (Unique FK→`users.id`), `cancer_type`, `diagnosis_date`, `treatment_plan`, `assigned_doctor_id` (FK→`users.id`), `created_at`, `updated_at`

- **`caregivers`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (Unique FK→`users.id`), `relationship`, `created_at`

- **`patient_caregiver`**
  - **کلیدها**: `id`, `UNIQUE(patient_id, caregiver_id)`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `caregiver_id` (FK→`caregivers.id`)

- **`doctors`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (Unique FK→`users.id`), `specialization`, `hospital_name`, `license_number`, `created_at`

- **`health_metrics`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `source`, `heart_rate`, `spo2`, `ecg_data` (JSONB), `temperature`, `respiration_rate`, `blood_pressure_sys`, `blood_pressure_dia`, `steps`, `activity_minutes`, `sleep_hours`, `stress_level`, `recorded_at`

- **`symptoms`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `symptom_type`, `severity`, `notes`, `recorded_at`

- **`emotions`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `emotion_type`, `intensity`, `notes`, `recorded_at`

- **`medications`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `name`, `dosage`, `frequency`, `start_date`, `end_date`

- **`reminders`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `type`, `title`, `message`, `scheduled_time`, `status`

- **`messages`**
  - **کلیدها**: `id`
  - **فیلدها**: `sender_id` (FK→`users.id`), `receiver_id` (FK→`users.id`), `message_type`, `content`, `created_at`

- **`chatbot_logs`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `question`, `answer`, `created_at`

- **`ai_alerts`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `alert_type`, `severity`, `status`, `description`, `created_at`

- **`ai_predictions`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `prediction_type`, `value`, `confidence_score`, `created_at`

- **`doctor_notes`**
  - **کلیدها**: `id`
  - **فیلدها**: `doctor_id` (FK→`doctors.id`), `patient_id` (FK→`patients.id`), `note_type`, `content`, `created_at`

- **`prescriptions`**
  - **کلیدها**: `id`
  - **فیلدها**: `doctor_id` (FK→`doctors.id`), `patient_id` (FK→`patients.id`), `medication_name`, `dosage`, `frequency`, `start_date`, `end_date`

- **`patient_reports`**
  - **کلیدها**: `id`
  - **فیلدها**: `patient_id` (FK→`patients.id`), `report_type`, `content` (JSONB), `created_at`

- **`audit_logs`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (FK→`users.id`), `action`, `details`, `created_at`

- **`api_tokens`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (FK→`users.id`), `token` (unique), `expires_at`

- **`alert_settings`**
  - **کلیدها**: `id`
  - **فیلدها**: `user_id` (FK→`users.id`), `heart_rate_threshold`, `sleep_threshold`, `activity_threshold`, `created_at`, `updated_at`

## روابط
- **`Role` 1:N `User`**
- **`User` 1:1 `Patient`**
- **`User` 1:1 `Caregiver`**
- **`User` 1:1 `Doctor`**
- **`Patient` M:N `Caregiver`** از طریق `patient_caregiver`
- **`Patient` 1:N** `HealthMetric`, `Symptom`, `Emotion`, `Medication`, `Reminder`, `ChatbotLog`, `AiAlert`, `AiPrediction`, `PatientReport`
- **`Doctor` 1:N** `DoctorNote`, `Prescription`
- **`Patient` 1:N** `DoctorNote`, `Prescription`
- **`Patient.assigned_doctor_id` → `users.id`** (پزشک منصوب‌شده)
- **`User` 1:N `Message`** به‌عنوان `sender` و 1:N به‌عنوان `receiver`
- **`User` 1:N `ApiToken`**, **`User` 1:N `AuditLog`**
- **`User` 1:N `AlertSetting`**

## نکات مهم
- **`users.is_verified`**: وضعیت تأیید حساب.
- **`ai_alerts.status`**: وضعیت هشدار (پیش‌فرض `active`).
- **`assigned_doctor_id`** در `patients` به یک رکورد در `users` اشاره می‌کند (ترجیحاً کاربر با نقش پزشک).
