# E-Service Portal

This project is a modern, fluid, and animated web application that serves as a portal for both service technicians and customers. It facilitates the management of job requests, scheduling, communication, invoicing, and payments in a streamlined interface.

**Live Demo:** [https://e-service-portal-195f5.web.app](https://e-service-portal-195f5.web.app)

---

## Features

### General
- **Dual User Roles:** Separate, tailored portals for Technicians and Customers.
- **Secure Authentication:** User sign-up and login powered by Firebase Authentication.
- **Real-time Database:** Job requests and conversations are updated in real-time using Firebase Firestore.
- **Responsive Design:** A clean, responsive UI built with Tailwind CSS that works on all screen sizes.
- **Smooth Animations:** User interface enhanced with fluid animations from Framer Motion.

### Technician Portal
- **Dashboard:** At-a-glance view of new requests, accepted jobs, and completed jobs.
- **Job Management:** View details of incoming service requests, with options to accept or decline.
- **Filtering System:** Easily filter jobs by status (Pending, Accepted, Completed) and urgency (Emergency, High, Normal).
- **Scheduling:** An integrated schedule view to see all upcoming and accepted jobs.
- **Invoicing:** Create and send detailed invoices to customers for completed work.
- **Rating System:** Rate customers after a job is complete to build a trusted community.
- **Live Messaging:** Communicate directly with customers regarding their service requests.

### Customer Portal
- **Request Management:** View a dashboard of all past and present service requests.
- **New Request Creation:** A comprehensive modal to submit new service requests, including:
    - Service category, location, and detailed description.
    - Urgency level selection.
    - An interactive calendar to select a preferred date and time slot.
    - Optional photo uploads for clarity.
- **Payment System:** Securely pay invoices for completed jobs.
- **Rating System:** Rate the technician's service after payment.
- **Live Messaging:** Communicate directly with the assigned technician.

---

## Tech Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **Backend & Database:** Firebase (Authentication, Firestore)
- **Animations:** Framer Motion
- **Build Tool:** Vite

---

## Running the Project Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli#install-cli-npm): `npm install -g firebase-tools`

### Instructions

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/your-username/e-service-portal.git](https://github.com/your-username/e-service-portal.git)
    cd e-service-portal
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Firebase**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - In your project, go to **Project Settings** > **General** and register a new **Web app**.
    - Firebase will provide a `firebaseConfig` object. You will need these keys.

4.  **Configure Environment Variables**
    - In the root of the project, create a file named `.env.local`.
    - Copy the template below and paste in the keys from your `firebaseConfig` object.

    **`.env.local` Template:**
    ```
    # Paste your Firebase config values here
    FIREBASE_API_KEY=AIza...
    FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    FIREBASE_PROJECT_ID=your-project-id
    FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    FIREBASE_MESSAGING_SENDER_ID=123...
    FIREBASE_APP_ID=1:123...
    FIREBASE_MEASUREMENT_ID=G-ABC...
    ```

5.  **Run the Application**
    ```bash
    npm run dev
    ```
    Open the local URL from your terminal (usually `http://localhost:5173`) to view the app.

---

## Deployment

This project is configured for continuous deployment using **Firebase Hosting** and **GitHub Actions**.

1.  **Push to GitHub:** Create your own repository on GitHub and push your code to the `main` branch.

2.  **Initialize Firebase Hosting:** Run `firebase init hosting` and follow the prompts, choosing to set up automatic builds with GitHub.

3.  **Add GitHub Secrets:** For the deployment to work, you must add your environment variables to your GitHub repository's secrets.
    - Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions**.
    - Add a new repository secret for each of the `FIREBASE_...` keys from your `.env.local` file.

Once configured, every push to the `main` branch will automatically build and deploy your application.
