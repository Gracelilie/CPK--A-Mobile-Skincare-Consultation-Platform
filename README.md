# CPK: A Wellness Platform

CPK is a wellness-focused mobile application that connects users with a team of professional aestheticians for personalized virtual skincare consultations. The platform features a secure communication system, a comprehensive progress tracker, a membership model, and a referral program. The backend is built with Python for robust data handling and security, while the frontend is a dynamic, user-friendly interface developed using React.

---

## Key Features

* **User Management & Security:** The platform includes secure user authentication, a role-based access system for clients and aestheticians, and end-to-end encryption to comply with privacy standards like HIPAA.
* **Consultation & Communication:** A system for scheduling appointments, an open chat feature, and a secure channel for sharing images with built-in watermarking to ensure confidentiality.
* **Personalized Experience:** A dynamic intake questionnaire tailors the user's experience and leads to customized recommendations and wellness pathways.
* **Progress Tracking:** Users can upload visual check-ins, log notes, and compare their progress over time. Aestheticians can view this data with the user's explicit permission.
* **Monetization & Engagement:** The app includes a subscription-based membership system and a referral program to encourage user growth and engagement.
* **Product Recommendations:** The platform provides curated product suggestions with affiliate links to external retail partners.

---

## Technology Stack

* **Frontend:** React (for the dynamic user interface)
* **Backend:** Python (with a framework like Django or Flask for the API)
* **Database:** PostgreSQL (for scalable data storage)
* **Deployment:** AWS (for reliable cloud infrastructure)

---

## Getting Started

This project is split into two parts: the React frontend and the Python backend. You will need to set up both to run the application.

#### Prerequisites

* Node.js and npm (or yarn) for the React frontend.
* Python 3.x for the backend.
* Access to an AWS account for the PostgreSQL database.

#### Installation

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    ```

2.  **Set up the Python backend:**
    ```bash
    cd [project-folder]/backend
    # Install dependencies
    pip install -r requirements.txt
    # Configure your AWS PostgreSQL database connection string
    # Run the server
    python manage.py runserver
    ```

3.  **Set up the React frontend:**
    ```bash
    cd [project-folder]/frontend
    # Install dependencies
    npm install
    # Configure the API endpoint to point to your backend
    # Run the app
    npm start
    ```

Your React app will now be running and connected to your Python backend.
