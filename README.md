# Crop Harvest Monitor

## Overview

Crop Harvest Monitor is a web-based application designed to help users manage their crops, monitor their growth, and access farming tips. This application allows users to register, log in, add and track crops, and receive notifications via email.

## Features

- User registration and login
- OTP verification for registration
- Crop management
- Farming tips
- Responsive design

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (v14 or later)
- MySQL (or compatible database)
- Gmail account for email notifications (optional)

## Setup

Follow these steps to set up and run the application:

### 1. Clone the Repository

- git clone repository-url
- cd repository-directory

### 2. Install dependencies

Run the following command to install the necessary Node.js packages

- npm install

### 3. Configure Environment Variables

HOST=database-hostname
USER=database-username
PASSWORD=yourpassword
DB_NAME=databasename
PORT=2400
SESSION_SECRET=your-session-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
API_KEY=your openweather API

### 4. Start the application by running the following command

-node server.js

### 5. view live application. The nodejs application above was hosted on render.

access the web app using the following link.
https://crop-harvest-monitor.onrender.com

### 5. Using the application.

-You will start by clicking on the register to create your account
-Your account will be verified by an OTP sent to your email
-You will then create password to log in
