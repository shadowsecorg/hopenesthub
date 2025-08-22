-- ===========================
-- HopeNest Hub Database Schema
-- writed by omid karami
-- ===========================

-- مدیریت کاربران و نقش‌ها
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    role_id INT REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- بیماران و مراقبین
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id),
    cancer_type VARCHAR(100),
    diagnosis_date DATE,
    treatment_plan TEXT,
    assigned_doctor_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE caregivers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id),
    relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE patient_caregiver (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    caregiver_id INT REFERENCES caregivers(id),
    UNIQUE(patient_id, caregiver_id)
);

-- پزشکان
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id),
    specialization VARCHAR(100),
    hospital_name VARCHAR(100),
    license_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- داده‌های سلامت
CREATE TABLE health_metrics (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    source VARCHAR(50),
    heart_rate INT,
    spo2 INT,
    ecg_data JSONB,
    temperature FLOAT,
    respiration_rate INT,
    blood_pressure_sys INT,
    blood_pressure_dia INT,
    steps INT,
    activity_minutes INT,
    sleep_hours FLOAT,
    stress_level INT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- علائم و احساسات
CREATE TABLE symptoms (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    symptom_type VARCHAR(50),
    severity INT,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emotions (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    emotion_type VARCHAR(50),
    intensity INT,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- دارو و یادآورها
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE
);

CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    type VARCHAR(50),
    title VARCHAR(100),
    message TEXT,
    scheduled_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- پیام‌ها و چت‌بات
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id),
    receiver_id INT REFERENCES users(id),
    message_type VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chatbot_logs (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    question TEXT,
    answer TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- تحلیل و هوش مصنوعی
CREATE TABLE ai_alerts (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    alert_type VARCHAR(100),
    severity VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    prediction_type VARCHAR(100),
    value VARCHAR(100),
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- نسخه و گزارش پزشک
CREATE TABLE doctor_notes (
    id SERIAL PRIMARY KEY,
    doctor_id INT REFERENCES doctors(id),
    patient_id INT REFERENCES patients(id),
    note_type VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    doctor_id INT REFERENCES doctors(id),
    patient_id INT REFERENCES patients(id),
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE
);

CREATE TABLE patient_reports (
    id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(id),
    report_type VARCHAR(50),
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- امنیت و لاگ‌ها
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    token TEXT UNIQUE,
    expires_at TIMESTAMP
);
