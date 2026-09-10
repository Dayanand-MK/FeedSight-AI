# FeedSight-AI Integration Flow

## Overview

FeedSight-AI combines virtual IoT monitoring with an AI-based
Fermentative Quality Index (FQI) estimation system.

The system intentionally separates real-time sensor monitoring from
AI quality estimation because the current virtual IoT prototype does
not directly measure every feature required by the trained ML model.

## 1. IoT Monitoring Layer

The Wokwi ESP32 prototype simulates:

- Temperature
- Humidity
- Moisture
- pH
- Ammonia

These measurements are used for live monitoring, alerts,
historical visualization, and demonstration of the sensing layer.

Flow:

Wokwi ESP32 -> FastAPI -> Local Storage -> Dashboard

A backend sensor simulator is retained as an offline/reliable
fallback for demonstrations.

## 2. AI Quality Assessment Layer

The trained Gradient Boosting model estimates the Fermentative
Quality Index (FQI).

Model inputs:

- pH
- Ammonia
- Lactic acid
- Acetic acid
- Propionic acid
- Butyric acid
- Ethanol
- Mannitol
- Dry matter
- Starch

Flow:

Frontend -> POST /api/v1/predict-fqi -> FQIPredictor
-> Gradient Boosting model -> Predicted FQI -> Frontend

## 3. Model

Algorithm:

GradientBoostingRegressor

Hold-out evaluation:

- MAE: 1.4080
- RMSE: 2.0490
- R2: 0.9619

5-fold cross-validation:

- Mean MAE: 1.2268
- Mean RMSE: 1.7875
- Mean R2: 0.9717
- R2 standard deviation: 0.0058

R2 values are regression evaluation metrics and must not be
described as classification accuracy.

## 4. API

AI prediction:

POST /api/v1/predict-fqi

Model information:

GET /api/v1/model-info

Simulation:

GET /api/v1/simulation/scenarios

GET /api/v1/simulation/reading/{scenario}

POST /api/v1/simulation/run/{scenario}

Cloud synchronization:

POST /api/v1/sync

## 5. Offline-First Design

FeedSight-AI is designed to continue operating locally when
internet connectivity is unavailable.

Primary storage and inference occur locally.

Cloud synchronization is optional.

## 6. Current Prototype Limitation

The Wokwi sensing prototype does not directly measure every
fermentation and composition feature required by the FQI model.

Therefore, IoT monitoring and FQI estimation are represented as
related but separate layers in the current prototype.

Additional FQI inputs can be supplied through the application
interface or demonstration dataset.

Future versions may integrate additional sensing or laboratory
measurement technologies.

## 7. Demo Reliability

The backend sensor simulator acts as a fallback if direct
Wokwi-to-backend communication is unavailable during the
demonstration.