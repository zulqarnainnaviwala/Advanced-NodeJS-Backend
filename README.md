# Advanced Node.js Backend

A scalable and production-grade backend API for video hosting and streaming, built with Node.js and Express.js. This project offers robust features for user management, video handling, and social interactions.

---

## Table of Contents

- [Features](#features)
  - [User Management](#user-management)
  - [Video Handling](#video-handling)
  - [Social Interactions](#social-interactions)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Entity-Relationship Data Model](#entity-relationship-data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

---

## Features

### **User Management**

- **Secure Registration and Login:**
  - Users can create accounts securely using email and password.
  - Authentication is handled using **JSON Web Tokens (JWT)**, ensuring secure and stateless communication between the client and server.
  - Tokens are generated upon successful login and can be used to access protected resources.
- **Profile Management:**
  - Users can view and update their profile details, such as name, bio, profile picture, and more.
  - The backend ensures validation of user input and maintains consistency in data storage.
  - Optional features such as password reset via email or multi-factor authentication can be added.

### **Video Handling**

- **Upload and Stream Videos:**

  - Users can upload videos of various formats (e.g., MP4, MKV).
  - The backend processes and stores uploaded videos, ensuring compatibility for streaming purposes.
  - Streaming is optimized for performance, supporting adaptive bitrate for a seamless viewing experience on different devices.

- **Efficient Storage Management:**
  - The system uses a cloud or local storage mechanism to handle large video files efficiently.
  - Video encoding and compression are implemented to optimize storage space without compromising quality.
  - Metadata, such as video title, description, duration, and resolution, is stored for easy retrieval and organization.

### **Social Interactions**

- **Add Comments, Like, and Share Videos:**

  - Users can post comments on videos, fostering community engagement.
  - A robust system ensures that comments are properly threaded and manageable by both users and moderators.
  - Videos can be liked, allowing creators to track their content's popularity.
  - Sharing features include generating sharable links or integrating with social media platforms for wider distribution.

- **Track Engagement Metrics:**
  - Video creators can access analytics for their videos, such as the number of views, likes, and comments.
  - Insights into user behavior, such as watch time and retention rates, provide valuable feedback for improving content.
  - The backend ensures accurate tracking by avoiding repeated views or fraudulent activity, ensuring authentic metrics.

## Technologies Used

- **Node.js:** JavaScript runtime for server-side development.
- **Express.js:** Web application framework for Node.js.

## Project Structure

```bash

    The repository is organized as follows:

    Advanced-NodeJS-Backend/
    ├── src/                 # Main source code of the application
    │   ├── routes/          # Route definitions for the API
    │   ├── controllers/     # Controller logic for handling requests
    │   ├── models/          # Database schemas and models (Mongoose)
    │   ├── middleware/      # Custom middleware for request handling
    │   └── utils/           # Utility functions and helpers
    ├── public/              # Static files and temporary uploads
    ├── .env.sample          # Example environment variable configuration
    ├── .gitignore           # Files and directories to exclude from Git
    ├── .prettierrc          # Prettier configuration for code formatting
    ├── .prettierignore      # Files/directories to exclude from Prettier
    ├── package.json         # Project metadata, scripts, and dependencies
    └── package-lock.json    # Dependency tree lockfile for consistent builds

```

## Entity-Relationship Data Model

The following diagram illustrates the core entity-relationship data model (ERD) for the project. This model defines the relationships between users, videos, comments, likes, and other key components of the system.

![Entity-Relationship Diagram](./public/temp/Entity-Relationship%20Data%20Model.png)

> **Interactive Version:** [Click here to view the ERD](https://app.eraser.io/workspace/2twgWjxxOyjHCtGX1QAT).

### Key Entities and Relationships

1. **Users**:

   - Attributes: `id`, `name`, `email`, `password`, `profile_picture`, etc.
   - Relationships:
     - Uploads videos (One-to-Many).
     - Posts comments (One-to-Many).
     - Likes videos (Many-to-Many).

2. **Videos**:

   - Attributes: `id`, `title`, `description`, `file_path`, `uploaded_by`, etc.
   - Relationships:
     - Belongs to a user (Many-to-One).
     - Has multiple comments (One-to-Many).
     - Liked by many users (Many-to-Many).

3. **Comments**:

   - Attributes: `id`, `video_id`, `user_id`, `content`, `timestamp`, etc.
   - Relationships:
     - Belongs to a video (Many-to-One).
     - Posted by a user (Many-to-One).

4. **Likes**:

   - Attributes: `id`, `user_id`, `video_id`, `timestamp`, etc.
   - Relationships:
     - Associated with a user and a video (Many-to-Many).

5. **Engagement Metrics**:
   - Attributes: `views`, `shares`, `watch_time`, etc.
   - Relationships:
     - Tracks analytics for videos.

This ERD provides a high-level overview of the application's database schema and helps in understanding the underlying data flow and relationships between entities.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js:** [Download and install Node.js](https://nodejs.org/).
- **npm:** Comes with Node.js; verify installation with `npm -v`.

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/zulqarnainnaviwala/Advanced-NodeJS-Backend.git

   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd Advanced-NodeJS-Backend
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

### Configuration

**Environment Variables:**

- Duplicate .env.sample and rename it to .env.
- Populate .env with the necessary environment-specific variables.

### Running the Application

1. **Start the Server:**

```bash
    npm run dev
```

2. **Access the Application:**

- Navigate to http://localhost:3000 in your browser.

## Contributing

Contributions are welcome! To contribute:

1. **Fork the Repository**.
2. **Create a Feature Branch**:

```bash
      git checkout -b feature/YourFeatureName
```

3. **Commit Your Changes**:

```bash
    git commit -m 'Add some feature'
```

4.  **Push to the Branch:**

```bash
    git push origin feature/YourFeatureName
```

5. **Open a Pull Request**.

## Acknowledgements

- [Node.js Documentation](https://nodejs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Guide](https://jwt.io/)
